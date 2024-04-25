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

import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";
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

import { addTallyResultsBatch, createMessage } from "./utils/maci";

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

    // Register recipient
    let recipientAddress = await recipient1.getAddress();
    let data = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "(uint256,string)"],
      [recipientAddress, ZeroAddress, [1n, "Project 1"]]
    );
    const RecipientRegistrationTx = await AlloContract.connect(
      recipient1
    ).registerRecipient(1n, data);
    await RecipientRegistrationTx.wait();

    // Review Acccept recipient
    let status = 2; // Accepted
    const ReviewRecipientTx = await QVMaciStrategy.connect(
      Coordinator
    ).reviewRecipients([recipientAddress], [status]);
    await ReviewRecipientTx.wait();

    // create 1 message for the recipient
    const votingOption =
      await QVMaciStrategy.connect(Coordinator).recipientIdToIndex(
        recipientAddress
      );

    const maciAddress = await maciContract.getAddress();

    await publish({
      pubkey: keypair.pubKey.serialize(),
      stateIndex: 1n,
      voteOptionIndex: votingOption,
      nonce: 1n,
      pollId: 0n,
      newVoteWeight: 9n,
      maciContractAddress: maciAddress,
      salt: genRandomSalt(),
      privateKey: keypair.privKey.serialize(),
      signer: allocator,
    } as PublishArgs);

    await timeTravel(Coordinator.provider as unknown as EthereumProvider, 700);

    await mergeMaciSubtrees({
      maciAddress,
      pollId: 0n,
      numQueueOps: "1",
      signer: Coordinator,
      quiet: false,
    });

    const random = Math.floor(Math.random() * 10 ** 8);

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

    await QVMaciStrategy.connect(Coordinator).publishTallyHash(tallyHash);
    console.log("Tally hash", tallyHash);

    // add tally results to funding round
    const recipientTreeDepth = voteOptionTreeDepth;

    console.log("Adding tally result on chain in batches of", tallyBatchSize)

    await addTallyResultsBatch(
      QVMaciStrategy.connect(Coordinator) as QVMACI,
      recipientTreeDepth,
      tally,
      tallyBatchSize
    );
    console.log("Finished adding tally results");

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

    // Finalize round
    await QVMaciStrategy.finalize(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString()
    );
  });

  it("Recipient should have more than 0 votes received", async () => {
    let recipientAddress = await recipient1.getAddress();
    let recipient = await QVMaciStrategy.recipients(recipientAddress);
    expect(recipient.totalVotesReceived).to.be.gt(0);
  });
});
