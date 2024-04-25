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
  PrivKey,
} from "maci-crypto";
import {
  MessageProcessor,
  MockVerifier,
  Verifier,
  VkRegistry,
} from "maci-contracts";

import {
  addTallyResult,
  addTallyResultsBatch,
  createMessage,
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
import { deployTestContracts, timeTravel } from "./utils";
import { QVMACIInterface } from "../typechain-types/contracts/strategies/qv-maci/QVMACI";
import { ClonableMACIInterface } from "../typechain-types/contracts/ClonableMaciContracts/ClonableMACI";

import { getTalyFilePath, isPathExist } from "./utils/misc";
import path from "path";

/**
 * Interface that represents user publish message
 */
export interface IPublishMessage {
  /**
   * The index of the state leaf
   */
  stateIndex: bigint;

  /**
   * The index of the vote option
   */
  voteOptionIndex: bigint;

  /**
   * The nonce of the message
   */
  nonce: bigint;

  /**
   * The new vote weight
   */
  newVoteWeight: bigint;
}

/**
 * Interface for the arguments to the batch publish command
 */
export interface IPublishBatchArgs {
  /**
   * User messages
   */
  messages: IPublishMessage[];

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  Poll: ClonablePoll;

  /**
   * The public key of the user
   */
  publicKey: string;

  /**
   * The private key of the user
   */
  privateKey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}
/**
 * Merge MACI message and signups subtrees
 * Must merge the subtrees before calling genProofs
 * @param maciAddress MACI contract address
 * @param pollId Poll id
 * @param numQueueOps Number of operations to perform for the merge
 * @param quiet Whether to log output
 */
export async function mergeMaciSubtrees({
  maciAddress,
  pollId,
  numQueueOps,
  signer,
  quiet,
}: {
  maciAddress: string;
  pollId: bigint;
  signer: Signer;
  numQueueOps?: string;
  quiet?: boolean;
}) {
  if (!maciAddress) throw new Error("Missing MACI address");

  await mergeMessages({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    signer,
    quiet,
  });

  await mergeSignups({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    signer,
    quiet,
  });
}

export const publishBatch = async ({
  messages,
  pollId,
  Poll,
  publicKey,
  privateKey,
  signer,
}: IPublishBatchArgs) => {
  if (!PubKey.isValidSerializedPubKey(publicKey)) {
    throw new Error("invalid MACI public key");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("invalid MACI private key");
  }

  if (pollId < 0n) {
    throw new Error(`invalid poll id ${pollId}`);
  }

  const userMaciPubKey = PubKey.deserialize(publicKey);
  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const pollContract = Poll.connect(signer);

  const [maxValues, coordinatorPubKeyResult] = await Promise.all([
    pollContract.maxValues(),
    pollContract.coordinatorPubKey(),
  ]);
  const maxVoteOptions = Number(maxValues.maxVoteOptions);

  // validate the vote options index against the max leaf index on-chain
  messages.forEach(({ stateIndex, voteOptionIndex, salt, nonce }) => {
    if (voteOptionIndex < 0 || maxVoteOptions < voteOptionIndex) {
      throw new Error("invalid vote option index");
    }

    // check < 1 cause index zero is a blank state leaf
    if (stateIndex < 1) {
      throw new Error("invalid state index");
    }

    if (nonce < 0) {
      throw new Error("invalid nonce");
    }
  });

  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  const encryptionKeypair = new Keypair();
  const sharedKey = Keypair.genEcdhSharedKey(
    encryptionKeypair.privKey,
    coordinatorPubKey
  );

  const payload: any[] = messages.map(
    ({ salt, stateIndex, voteOptionIndex, newVoteWeight, nonce }) => {
      const userSalt = salt ? BigInt(salt) : genRandomSalt();

      // create the command object
      const command = new PCommand(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex,
        newVoteWeight,
        nonce,
        BigInt(pollId),
        userSalt
      );

      // sign the command with the user private key
      const signature = command.sign(userMaciPrivKey);

      const message = command.encrypt(signature, sharedKey);

      return [
        message.asContractParam(),
        encryptionKeypair.pubKey.asContractParam(),
      ];
    }
  );

  const preparedMessages = payload.map(([message]) => message);
  const preparedKeys = payload.map(([, key]) => key);

  const receipt = await pollContract
    .publishMessageBatch(preparedMessages.reverse(), preparedKeys.reverse())
    .then((tx) => tx.wait());

  return {
    hash: receipt?.hash,
    encryptedMessages: preparedMessages,
    privateKey: encryptionKeypair.privKey.serialize(),
  };
};

// MACI zkFiles
const circuit = process.env.CIRCUIT_TYPE || DEFAULT_CIRCUIT;
const circuitDirectory = process.env.CIRCUIT_DIRECTORY || "./../zkeys/zkeys";
const proofOutputDirectory = process.env.PROOF_OUTPUT_DIR || "./proof_output";
const tallyBatchSize = Number(process.env.TALLY_BATCH_SIZE || 8);

const voteOptionTreeDepth = 3;

describe("e2e", function test() {
  this.timeout(9000000000000000);
  let mpContract: MessageProcessor;
  let poll: Poll;

  let tallyData: ITallyCircuitInputs;
  let QVMaciStrategy: QVMACI;
  let QVMaciStrategyAddress: string;

  let Coordinator: Signer;
  let allocator: Signer;
  let recipient1: Signer;
  let recipient2: Signer;
  let CoordinatorAddress: string;

  // create a new user keypair
  const keypair = new Keypair();
  let coordinatorKeypair: Keypair;
  let maciTransactionHash: string;
  let iface: QVMACIInterface;
  let ifaceClonableMACI: ClonableMACIInterface;
  let verifierContract: Verifier;
  let vkRegistryContract: VkRegistry;
  let maciContract: ClonableMACI;
  let pollContract: ClonablePoll;
  let tallyContract: ClonableTally;
  let AlloContract: Allo;
  let deployTime: number;
  let quiet = true as any;

  const random = Math.floor(Math.random() * 10 ** 8);

  before(async () => {
    [Coordinator] = await ethers.getSigners();

    CoordinatorAddress = await Coordinator.getAddress();
    const contracts = await deployTestContracts();

    AlloContract = contracts.Allo;
    QVMaciStrategy = contracts.QVMACI_STRATEGY;
    pollContract = contracts.pollContract;
    tallyContract = contracts.tallyContract;
    mpContract = contracts.messageProcessorContract;
    verifierContract = contracts.verifierContract;
    vkRegistryContract = contracts.vkRegistryContract;
    maciContract = contracts.maciContract;
    QVMaciStrategyAddress = await QVMaciStrategy.getAddress();
    allocator = contracts.user1;
    recipient1 = contracts.user2;
    recipient2 = contracts.user3;
    maciTransactionHash = contracts.maciTransitionHash || "";
    coordinatorKeypair = contracts.CoordinatorKeypair;

    iface = QVMaciStrategy.interface;
    ifaceClonableMACI = maciContract.interface;

    let _mpContract = mpContract.connect(Coordinator);

    // Add allocator
    const addAllocatorTx = await QVMaciStrategy.addAllocator(
      await allocator.getAddress()
    );
    await addAllocatorTx.wait();

    // signup
    const SignUpTx = await QVMaciStrategy.connect(allocator).signup(
      keypair.pubKey.asContractParam()
    );
    await SignUpTx.wait();

    // Register recipients
    let recipientAddress1 = await recipient1.getAddress();
    let data = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "(uint256,string)"],
      [recipientAddress1, ZeroAddress, [1n, "Project 1"]]
    );

    const RecipientRegistrationTx = await AlloContract.connect(
      recipient1
    ).registerRecipient(1n, data);
    await RecipientRegistrationTx.wait();

    let recipientAddress2 = await recipient2.getAddress();
    data = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "(uint256,string)"],
      [recipientAddress2, ZeroAddress, [1n, "Project 2"]]
    );

    const RecipientRegistrationTx2 = await AlloContract.connect(
      recipient2
    ).registerRecipient(1n, data);
    await RecipientRegistrationTx2.wait();

    // Review Acccept recipient
    let status = 2; // Accepted
    const ReviewRecipientTx = await QVMaciStrategy.connect(
      Coordinator
    ).reviewRecipients(
      [recipientAddress1, recipientAddress2],
      [status, status]
    );
    await ReviewRecipientTx.wait();

    // create 1 vote message for the recipient1
    const votingOption1 =
      await QVMaciStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress1
      );

    const maciAddress = await maciContract.getAddress();

    // await publish({
    //   pubkey: keypair.pubKey.serialize(),
    //   stateIndex: 1n,
    //   voteOptionIndex: votingOption1,
    //   nonce: 1n,
    //   pollId: 0n,
    //   newVoteWeight: 10n,
    //   maciContractAddress: maciAddress,
    //   salt: genRandomSalt(),
    //   privateKey: keypair.privKey.serialize(),
    //   signer: allocator,
    // } as PublishArgs);

    // create 1 vote message for the recipient1
    const votingOption2 =
      await QVMaciStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress2
      );

    // await publish({
    //   pubkey: keypair.pubKey.serialize(),
    //   stateIndex: 1n,
    //   voteOptionIndex: votingOption2,
    //   nonce: 2n,
    //   pollId: 0n,
    //   newVoteWeight: 30n,
    //   maciContractAddress: maciAddress,
    //   salt: genRandomSalt(),
    //   privateKey: keypair.privKey.serialize(),
    //   signer: allocator,
    // } as PublishArgs);

    await publishBatch({
      messages: [
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption1,
          nonce: 1n,
          newVoteWeight: 1n,
        },
        {
          stateIndex: 1n,
          voteOptionIndex: votingOption2,
          nonce: 2n,
          newVoteWeight: 5n,
        },
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

    await addTallyResult(
      QVMaciStrategy.connect(Coordinator) as QVMACI,
      recipientTreeDepth,
      tally,
      Number(votingOption1)
    );

    await addTallyResult(
      QVMaciStrategy.connect(Coordinator) as QVMACI,
      recipientTreeDepth,
      tally,
      Number(votingOption2)
    );

    console.log("Finished adding tally results");
  });

  it("Recipient should have more than 0 votes received", async () => {
    let recipientAddress = await recipient1.getAddress();
    let recipient = await QVMaciStrategy.recipients(recipientAddress);
    console.log("Recipient", recipient);

    expect(recipient.totalVotesReceived).to.be.eq(
      Math.floor(Math.sqrt(1 * 10 ** 18))
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
      recipientTreeDepth
    );

    const perVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
      BigInt(tally.perVOSpentVoiceCredits.salt),
      recipientTreeDepth
    );

    console.log(
      "Tally total spent voice credits",
      tally.totalSpentVoiceCredits.spent
    );

    // Finalize round
    let finalize = await QVMaciStrategy.connect(Coordinator).finalize(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString()
    );

    let receipt = await finalize.wait();

    let isFinalized = await QVMaciStrategy.isFinalized();
    expect(isFinalized).to.be.true;
  });

  it("Should Distribute Founds", async () => {
    const recipient1Balance = await ethers.provider.getBalance(
      await recipient1.getAddress()
    );
    const recipient2Balance = await ethers.provider.getBalance(
      await recipient2.getAddress()
    );
    const recipientIDs = [
      await recipient1.getAddress(),
      await recipient2.getAddress(),
    ];
    let distributeFunds = await AlloContract.connect(Coordinator).distribute(
      1,
      recipientIDs,
      "0x00"
    );
    let receipt = await distributeFunds.wait();

    const recipient1BalanceAfterDistribution = await ethers.provider.getBalance(
      await recipient1.getAddress()
    );
    const recipient2BalanceAfterDistribution = await ethers.provider.getBalance(
      await recipient2.getAddress()
    );

    console.log(
      "Recipient 1 balance before Distribution: ",
      recipient1Balance,
      " & After : ",
      recipient1BalanceAfterDistribution
    );
    console.log("Recipient 2 balance before Distribution: ",recipient2Balance, " & After : ",  recipient2BalanceAfterDistribution);

    expect(recipient1BalanceAfterDistribution).to.be.greaterThan(
      recipient1Balance
    );
    expect(recipient2BalanceAfterDistribution).to.be.greaterThan(recipient2Balance);
  });
});
