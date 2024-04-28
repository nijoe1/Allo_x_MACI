import { expect } from "chai";
import { ethers } from "hardhat";

import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { existsSync, mkdirSync } from "fs";

import { Keypair } from "maci-domainobjs";

import { genTreeCommitment as genTallyResultCommitment } from "maci-crypto";

import { MessageProcessor } from "maci-contracts";

import {
  addTallyResultsBatch,
  bnSqrt,
  getRecipientClaimData,
  mergeMaciSubtrees,
  publishBatch,
} from "./utils/maci";

import { getCircuitFiles } from "./utils/circuits";

import { JSONFile } from "./utils/JSONFile";

import { getIpfsHash } from "./utils/ipfs";

import { genProofs, proveOnChain, GenProofsArgs } from "maci-cli";

import type { EthereumProvider } from "hardhat/types";

import {
  QFMACI,
  ClonableMACI,
  ClonablePoll,
  ClonableTally,
  Allo,
} from "../typechain-types";
import { deployTestContracts, timeTravel } from "./utils_qf";

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
  let QFMACIStrategy: QFMACI;

  let Coordinator: Signer;
  let allocator: Signer;
  let recipient1: Signer;
  let recipient2: Signer;

  // create a new user keypair
  const keypair = new Keypair();
  const keypair2 = new Keypair();
  let coordinatorKeypair: Keypair;
  let maciTransactionHash: string;
  let maciContract: ClonableMACI;
  let pollContract: ClonablePoll;
  let tallyContract: ClonableTally;
  let AlloContract: Allo;

  const UNIT = 10n ** 18n;

  const CONTRIBUTION_AMOUNT1 = 100n * UNIT;

  const CONTRIBUTION_AMOUNT2 = 73n * UNIT;

  const VoiceCreditsFactor = 10000000000000n;

  const TOTAL_VOTES1 = (CONTRIBUTION_AMOUNT1 * 4n) / 10n / VoiceCreditsFactor;

  const TOTAL_VOTES2 = (CONTRIBUTION_AMOUNT2 * 4n) / 10n / VoiceCreditsFactor;

  const random = Math.floor(Math.random() * 10 ** 8);

  before(async () => {
    [Coordinator] = await ethers.getSigners();

    const contracts = await deployTestContracts();

    AlloContract = contracts.Allo;
    QFMACIStrategy = contracts.QFMACI_STRATEGY;
    pollContract = contracts.pollContract;
    tallyContract = contracts.tallyContract;
    mpContract = contracts.messageProcessorContract;
    maciContract = contracts.maciContract;
    allocator = contracts.user1;
    recipient1 = contracts.user2;
    recipient2 = contracts.user3;
    maciTransactionHash = contracts.maciTransitionHash || "";
    coordinatorKeypair = contracts.CoordinatorKeypair;

    const types = ["(uint256,uint256)", "uint256"];

    const contributeData1 = [
      [keypair.pubKey.asContractParam().x, keypair.pubKey.asContractParam().y],
      CONTRIBUTION_AMOUNT1,
    ];
    const contributeData2 = [
      [
        keypair2.pubKey.asContractParam().x,
        keypair2.pubKey.asContractParam().y,
      ],
      CONTRIBUTION_AMOUNT2,
    ];

    const contributeEncodedData1 = AbiCoder.defaultAbiCoder().encode(
      types,
      contributeData1,
    );

    // signup2
    const SignUpTx1 = await AlloContract.connect(allocator).allocate(
      1,
      contributeEncodedData1,
      { value: CONTRIBUTION_AMOUNT1 },
    );
    await SignUpTx1.wait();

    const contributeEncodedData2 = AbiCoder.defaultAbiCoder().encode(
      types,
      contributeData2,
    );

    // signup2
    const SignUpTx2 = await AlloContract.connect(recipient1).allocate(
      1,
      contributeEncodedData2,
      { value: CONTRIBUTION_AMOUNT2 },
    );
    await SignUpTx2.wait();

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
    const ReviewRecipientsTx = await QFMACIStrategy.connect(
      Coordinator,
    ).reviewRecipients(
      [recipientAddress1, recipientAddress2],
      [status, status],
    );
    await ReviewRecipientsTx.wait();

    // create 1 vote message for the recipient1
    const votingOption1 =
      await QFMACIStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress1,
      );

    const maciAddress = await maciContract.getAddress();

    // create 1 vote message for the recipient1
    const votingOption2 =
      await QFMACIStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress2,
      );
    // When submitting to the same vote index, the last vote weight will be the final vote weight
    // When voting weight is 5 that means that the circouts will calculate the square of the weight so 5^2 = 25
    // BUt the final vote weight will be 5

    const remainder = bnSqrt(
      TOTAL_VOTES1 -
        bnSqrt((TOTAL_VOTES1 * 1n) / 3n) ** 2n +
        bnSqrt((TOTAL_VOTES1 * 2n) / 3n) ** 2n
    )
    await publishBatch({
      messages: [
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption1,
          nonce: 1n,
          newVoteWeight: bnSqrt((TOTAL_VOTES1 * 1n) / 3n),
        },
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption2,
          nonce: 2n,
          newVoteWeight: bnSqrt((TOTAL_VOTES1 * 2n) / 3n),
        },
      ],
      pollId: 0n,
      Poll: pollContract,
      publicKey: keypair.pubKey.serialize(),
      privateKey: keypair.privKey.serialize(),
      signer: allocator,
    });

    console.log(
      bnSqrt(
        TOTAL_VOTES1 -
          bnSqrt((TOTAL_VOTES1 * 1n) / 3n) ** 2n +
          bnSqrt((TOTAL_VOTES1 * 2n) / 3n) ** 2n
      )
    );

    await publishBatch({
      messages: [
        {
          stateIndex: 2n,
          voteOptionIndex: votingOption1,
          nonce: 1n,
          // Casting the one third of the total votes
          newVoteWeight: bnSqrt((TOTAL_VOTES2 * 1n) / 3n),
        },
        {
          stateIndex: 2n,
          voteOptionIndex: votingOption2,
          nonce: 2n,
          // Casting the two third of the total votes
          newVoteWeight: bnSqrt((TOTAL_VOTES2 * 2n) / 3n),
        },
      ],
      pollId: 0n,
      Poll: pollContract,
      publicKey: keypair2.pubKey.serialize(),
      privateKey: keypair2.privKey.serialize(),
      signer: recipient1,
    });

    await timeTravel(Coordinator.provider as unknown as EthereumProvider, 700);

    await mergeMaciSubtrees({
      maciAddress,
      pollId: 0n,
      numQueueOps: "1",
      signer: Coordinator,
      quiet: true,
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
      quiet: true,
    });

    console.log("finished proveOnChain");

    const tally = JSONFile.read(tallyFile) as any;
    const tallyHash = await getIpfsHash(tally);

    let publishTallyHashReceipt =
      await QFMACIStrategy.connect(Coordinator).publishTallyHash(tallyHash);

    await publishTallyHashReceipt.wait();

    console.log("Tally hash", tallyHash);

    // add tally results to funding round
    const recipientTreeDepth = voteOptionTreeDepth;

    console.log("Adding tally result on chain in batches of", tallyBatchSize);

    await addTallyResultsBatch(
      QFMACIStrategy.connect(Coordinator) as QFMACI,
      recipientTreeDepth,
      tally,
      tallyBatchSize,
    );

    console.log("Finished adding tally results");
  });

  it("Recipient should have more than 0 votes received", async () => {
    let recipientAddress = await recipient1.getAddress();
    let recipient = await QFMACIStrategy.recipients(recipientAddress);
    console.log("Recipient", recipient);

    let recipientAddress2 = await recipient2.getAddress();
    recipient = await QFMACIStrategy.recipients(recipientAddress2);
    console.log("Recipient 2", recipient);
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
    let finalize = await QFMACIStrategy.connect(Coordinator).finalize(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString(),
    );

    await finalize.wait();

    let isFinalized = await QFMACIStrategy.isFinalized();
    expect(isFinalized).to.be.true;
  });

  it("Should Distribute Founds", async () => {
    const outputDir = path.join(proofOutputDirectory, `${random}`);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const tallyFile = getTalyFilePath(outputDir);

    const tally = JSONFile.read(tallyFile) as any;

    const recipientTreeDepth = voteOptionTreeDepth;

    const recipientIndex1 = await QFMACIStrategy.recipientIdToIndex(
      await recipient1.getAddress(),
    );

    const distributeData1 = getRecipientClaimData(
      Number(recipientIndex1),
      recipientTreeDepth,
      tally,
    );

    let initStruct = [distributeData1];

    const distributeData2 = getRecipientClaimData(
      Number(
        await QFMACIStrategy.recipientIdToIndex(await recipient2.getAddress()),
      ),
      recipientTreeDepth,
      tally,
    );

    let types = ["(uint256,uint256,uint256[][],uint256,uint256,uint256)"];

    let AbiCoder = new ethers.AbiCoder();

    let bytes = AbiCoder.encode(types, initStruct);

    let bytes2 = AbiCoder.encode(types, [distributeData2]);

    let bytesArray = [bytes, bytes2];

    let bytesArrayTypes = ["bytes[]"];

    let bytesArrayEncoded = AbiCoder.encode(bytesArrayTypes, [bytesArray]);

    console.log(
      "Pool Balance Before Distribution is :",
      await QFMACIStrategy.getPoolAmount(),
    );

    const recipient1Balance = await ethers.provider.getBalance(
      await recipient1.getAddress(),
    );
    const recipient2Balance = await ethers.provider.getBalance(
      await recipient2.getAddress(),
    );

    let distributeFunds = await AlloContract.connect(Coordinator).distribute(
      1,
      [],
      bytesArrayEncoded,
    );
    await distributeFunds.wait();

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
      await ethers.provider.getBalance(await QFMACIStrategy.getAddress()),
    );
  });
});
