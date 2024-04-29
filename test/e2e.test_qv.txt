import { expect, use } from "chai";
import { ethers } from "hardhat";
import {
  AbiCoder,
  BytesLike,
  Signer,
  ZeroAddress,
  keccak256,
  toNumber,
  type BigNumberish,
} from "ethers";
import { existsSync, mkdirSync } from "fs";

import { Keypair, Message, PCommand, PrivKey, PubKey } from "maci-domainobjs";
import { ITallyCircuitInputs, MaciState, Poll } from "maci-core";
import {
  genTreeCommitment as genTallyResultCommitment,
  genRandomSalt,
} from "maci-crypto";
import {
  MessageProcessor,
  MockVerifier,
  Verifier,
  VkRegistry,
} from "maci-contracts";

import {
  addTallyResultsBatch,
  bnSqrt,
  getRecipientClaimData,
  mergeMaciSubtrees,
  publishBatch,
} from "./utils/maci";

import { DEFAULT_CIRCUIT, getCircuitFiles } from "./utils/circuits";

import { JSONFile } from "./utils/JSONFile";

import { getIpfsHash } from "./utils/ipfs";

import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
  GenProofsArgs,
  publish,
  PublishArgs,
} from "maci-cli";

import type { EthereumProvider } from "hardhat/types";

import {
  QVMACI,
  ClonableMACI,
  ClonablePoll,
  ClonableTally,
  Allo,
} from "../typechain-types";
import { deployTestContracts, timeTravel } from "./utils_qv";

import { getTalyFilePath } from "./utils/misc";
import path from "path";

// MACI zkFiles
const circuitDirectory = process.env.CIRCUIT_DIRECTORY || "./../zkeys/zkeys";
const proofOutputDirectory = process.env.PROOF_OUTPUT_DIR || "./proof_output";
const tallyBatchSize = Number(process.env.TALLY_BATCH_SIZE || 8);

const voteOptionTreeDepth = 3;

describe("e2e", function test() {
  this.timeout(9000000000000000);
  let mpContract: MessageProcessor;
  let poll: Poll;

  let QVMaciStrategy: QVMACI;

  let Coordinator: Signer;
  let allocator: Signer;
  let recipient1: Signer;
  let recipient2: Signer;

  // create a new user keypair
  const keypair = new Keypair();
  let coordinatorKeypair: Keypair;
  let maciTransactionHash: string;
  let maciContract: ClonableMACI;
  let pollContract: ClonablePoll;
  let tallyContract: ClonableTally;
  let AlloContract: Allo;

  const random = Math.floor(Math.random() * 10 ** 8);

  before(async () => {
    [Coordinator] = await ethers.getSigners();

    const contracts = await deployTestContracts();

    AlloContract = contracts.Allo;
    QVMaciStrategy = contracts.QVMACI_STRATEGY;
    pollContract = contracts.pollContract;
    tallyContract = contracts.tallyContract;
    mpContract = contracts.messageProcessorContract;
    maciContract = contracts.maciContract;
    allocator = contracts.user1;
    recipient1 = contracts.user2;
    recipient2 = contracts.user3;
    maciTransactionHash = contracts.maciTransitionHash || "";
    coordinatorKeypair = contracts.CoordinatorKeypair;

    let _mpContract = mpContract.connect(Coordinator);

    // Add allocator
    const addAllocatorTx = await QVMaciStrategy.addAllocator(
      await allocator.getAddress(),
    );
    await addAllocatorTx.wait();

    // signup
    const SignUpTx = await QVMaciStrategy.connect(allocator).signup(
      keypair.pubKey.asContractParam(),
    );
    await SignUpTx.wait();

    // Register recipients
    let recipientAddress1 = await recipient1.getAddress();
    let data = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "(uint256,string)"],
      [recipientAddress1, ZeroAddress, [1n, "Project 1"]],
    );

    const RecipientRegistrationTx = await AlloContract.connect(
      recipient1,
    ).registerRecipient(1n, data);
    await RecipientRegistrationTx.wait();

    let recipientAddress2 = await recipient2.getAddress();
    data = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "(uint256,string)"],
      [recipientAddress2, ZeroAddress, [1n, "Project 2"]],
    );

    const RecipientRegistrationTx2 = await AlloContract.connect(
      recipient2,
    ).registerRecipient(1n, data);
    await RecipientRegistrationTx2.wait();

    // Review Acccept recipient
    let status = 2; // Accepted
    const ReviewRecipientTx = await QVMaciStrategy.connect(
      Coordinator,
    ).reviewRecipients(
      [recipientAddress1, recipientAddress2],
      [status, status],
    );
    await ReviewRecipientTx.wait();

    // create 1 vote message for the recipient1
    const votingOption1 =
      await QVMaciStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress1,
      );

    const maciAddress = await maciContract.getAddress();

    // create 1 vote message for the recipient1
    const votingOption2 =
      await QVMaciStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress2,
      );
    // When submitting to the same vote index, the last vote weight will be the final vote weight
    // When voting weight is 5 that means that the circouts will calculate the square of the weight so 5^2 = 25
    // BUt the final vote weight will be 5
    await publishBatch({
      messages: [
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption1,
          nonce: 1n,
          newVoteWeight: bnSqrt(36n),
        },
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption2,
          nonce: 2n,
          newVoteWeight: bnSqrt(25n),
        },
        // {
        //   stateIndex: 1n,
        //   voteOptionIndex: votingOption1,
        //   nonce: 3n,
        //   newVoteWeight: bnSqrt(30n),
        // },
      ],
      pollId: 0n,
      Poll: pollContract,
      publicKey: keypair.pubKey.serialize(),
      privateKey: keypair.privKey.serialize(),
      signer: allocator,
    });

    await timeTravel(Coordinator.provider as unknown as EthereumProvider, 700);

    await mergeMaciSubtrees({
      maciAddress,
      pollId: 0n,
      numQueueOps: "1",
      signer: Coordinator,
      quiet: false,
    });

    const outputDir = path.join(proofOutputDirectory, `${random}`);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const tallyFile = getTalyFilePath(outputDir);

    const {
      processZkFile,
      tallyZkFile,
      processWitness,
      processWasm,
      tallyWitness,
      tallyWasm,
    } = getCircuitFiles("micro", circuitDirectory);
    await genProofs({
      outputDir: outputDir,
      tallyFile: tallyFile,
      tallyZkey: tallyZkFile,
      processZkey: processZkFile,
      pollId: 0n,
      rapidsnark: undefined,
      processWitgen: processWitness,
      processDatFile: undefined,
      tallyWitgen: tallyWitness,
      tallyDatFile: undefined,
      coordinatorPrivKey: coordinatorKeypair.privKey.serialize(),
      maciAddress: maciAddress,
      transactionHash: maciTransactionHash,
      processWasm: processWasm,
      tallyWasm: tallyWasm,
      useWasm: true,
      stateFile: undefined,
      startBlock: undefined,
      blocksPerBatch: 50,
      endBlock: undefined,
      signer: Coordinator,
      tallyAddress: await tallyContract.getAddress(),
      useQuadraticVoting: true,
      quiet: false,
    } as GenProofsArgs);

    const tallyAddress = await tallyContract.getAddress();
    const messageProcessorAddress = await mpContract.getAddress();

    // Submit proofs to MACI contract
    await proveOnChain({
      pollId: 0n,
      proofDir: outputDir,
      subsidyEnabled: false,
      maciAddress,
      messageProcessorAddress,
      tallyAddress,
      signer: Coordinator,
      quiet: false,
    });

    console.log("finished proveOnChain");

    const tally = JSONFile.read(tallyFile) as any;
    const tallyHash = await getIpfsHash(tally);

    let publishTallyHashReceipt =
      await QVMaciStrategy.connect(Coordinator).publishTallyHash(tallyHash);

    await publishTallyHashReceipt.wait();

    console.log("Tally hash", tallyHash);

    // add tally results to funding round
    const recipientTreeDepth = voteOptionTreeDepth;

    console.log("Adding tally result on chain in batches of", tallyBatchSize);

    await addTallyResultsBatch(
      QVMaciStrategy.connect(Coordinator) as any,
      recipientTreeDepth,
      tally,
      tallyBatchSize,
    );

    // await addTallyResult(
    //   QVMaciStrategy.connect(Coordinator) as QVMACI,
    //   recipientTreeDepth,
    //   tally,
    //   Number(votingOption1)
    // );

    // await addTallyResult(
    //   QVMaciStrategy.connect(Coordinator) as QVMACI,
    //   recipientTreeDepth,
    //   tally,
    //   Number(votingOption2)
    // );

    console.log("Finished adding tally results");
  });

  it("Recipient should have more than 0 votes received", async () => {
    let recipientAddress = await recipient1.getAddress();
    let recipient = await QVMaciStrategy.recipients(recipientAddress);
    console.log("Recipient", recipient);

    expect(recipient.totalVotesReceived).to.be.eq(
      Math.floor(Math.sqrt(30 * 10 ** 18)),
    );
  });

  it("Should Finalize the Round", async () => {
    const outputDir = path.join(proofOutputDirectory, `${random}`);

    const tallyFile = getTalyFilePath(outputDir);

    const tally = JSONFile.read(tallyFile) as any;

    const recipientTreeDepth = voteOptionTreeDepth;

    const newResultCommitment = genTallyResultCommitment(
      tally.results.tally.map((x: string) => BigInt(x)),
      BigInt(tally.results.salt),
      recipientTreeDepth,
    );

    const perVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
      BigInt(tally.perVOSpentVoiceCredits.salt),
      recipientTreeDepth,
    );

    console.log(
      "Tally total spent voice credits",
      tally.totalSpentVoiceCredits.spent,
    );

    // Finalize round
    let finalize = await QVMaciStrategy.connect(Coordinator).finalize(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString(),
    );

    let receipt = await finalize.wait();

    let isFinalized = await QVMaciStrategy.isFinalized();
    expect(isFinalized).to.be.true;
  });

  it("Should Distribute Founds", async () => {
    console.log(
      "Pool Balance Before Distribution",
      await ethers.provider.getBalance(await QVMaciStrategy.getAddress()),
    );

    const recipient1Balance = await ethers.provider.getBalance(
      await recipient1.getAddress(),
    );
    const recipient2Balance = await ethers.provider.getBalance(
      await recipient2.getAddress(),
    );
    const recipientIDs = [
      await recipient1.getAddress(),
      await recipient2.getAddress(),
    ];
    let distributeFunds = await AlloContract.connect(Coordinator).distribute(
      1,
      recipientIDs,
      "0x00",
    );
    let receipt = await distributeFunds.wait();

    const recipient1BalanceAfterDistribution = await ethers.provider.getBalance(
      await recipient1.getAddress(),
    );
    const recipient2BalanceAfterDistribution = await ethers.provider.getBalance(
      await recipient2.getAddress(),
    );

    console.log(
      "Recipient 1 balance before Distribution: ",
      recipient1Balance,
      " & After : ",
      recipient1BalanceAfterDistribution,
      " & Difference: ",
      Number(recipient1BalanceAfterDistribution - recipient1Balance) / 10 ** 18,
    );
    console.log(
      "Recipient 2 balance before Distribution: ",
      recipient2Balance,
      " & After : ",
      recipient2BalanceAfterDistribution,
      " & Difference: ",
      Number(recipient2BalanceAfterDistribution - recipient2Balance) / 10 ** 18,
    );

    expect(recipient1BalanceAfterDistribution).to.be.greaterThan(
      recipient1Balance,
    );
    expect(recipient2BalanceAfterDistribution).to.be.greaterThan(
      recipient2Balance,
    );

    console.log(
      "Pool Balance After Distribution",
      await ethers.provider.getBalance(await QVMaciStrategy.getAddress()),
    );
  });
});
