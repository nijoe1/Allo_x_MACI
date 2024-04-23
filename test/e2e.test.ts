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
import { genTreeCommitment } from "maci-crypto";
import {
  ERC20,
  MessageProcessor,
  MessageProcessor__factory,
  MockVerifier,
  Poll__factory,
  VkRegistry,
} from "maci-contracts";

import { addTallyResultsBatch, createMessage } from "./utils/maci";

import { DEFAULT_CIRCUIT } from "./utils/circuits";

import { MaciParameters } from "./utils/maciParameters";

import { JSONFile } from "./utils/JSONFile";

import {
  UNIT,
  ALPHA_PRECISION,
  DEFAULT_GET_LOG_BATCH_SIZE,
  DEFAULT_SR_QUEUE_OPS,
} from "./utils/constants";

import { getIpfsHash } from "./utils/ipfs";

import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
  GenProofsArgs,
  genLocalState,
  verify,
} from "maci-cli";

import type { EthereumProvider } from "hardhat/types";

import {
  QVMACI,
  ClonableMACI,
  ClonablePoll,
  ClonableTally,
  ClonableMessageProcessor,
  Allo,
} from "../typechain-types";
import {
  STATE_TREE_DEPTH,
  deployTestContracts,
  maxValues,
  messageBatchSize,
  timeTravel,
  treeDepths,
} from "./utils";
import { QVMACIInterface } from "../typechain-types/contracts/strategies/qv-maci/QVMACI";
import { ClonableMACIInterface } from "../typechain-types/contracts/ClonableMaciContracts/ClonableMACI";
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
/* Input to getGenProofArgs() */
type getGenProofArgsInput = {
  maciAddress: string;
  pollId: bigint;
  // coordinator's MACI serialized secret key
  coordinatorMacisk: string;
  // the transaction hash of the creation of the MACI contract
  maciTxHash?: string;
  // the key get zkeys file mapping, see utils/circuits.ts
  circuitType: string;
  circuitDirectory: string;
  rapidsnark?: string;
  // where the proof will be produced
  outputDir: string;
  // number of blocks of logs to fetch per batch
  blocksPerBatch: number;
  // fetch logs from MACI from these start and end blocks
  startBlock?: number;
  endBlock?: number;
  // MACI state file
  maciStateFile?: string;
  // transaction signer
  signer: Signer;
  // flag to turn on verbose logging in MACI cli
  quiet?: boolean;
};

// MACI zkFiles
const circuit = process.env.CIRCUIT_TYPE || DEFAULT_CIRCUIT;
const circuitDirectory = process.env.CIRCUIT_DIRECTORY || "./params";
const rapidsnark = process.env.RAPID_SNARK || "~/rapidsnark/package/bin/prover";
const proofOutputDirectory = process.env.PROOF_OUTPUT_DIR || "./proof_output";
const tallyBatchSize = Number(process.env.TALLY_BATCH_SIZE || 8);

/*
 * Get the arguments to pass to the genProof function
 */
export function getGenProofArgs(args: getGenProofArgsInput) {
  //  : GenProofsArgs {
  const {
    maciAddress,
    pollId,
    coordinatorMacisk,
    maciTxHash,
    circuitType,
    circuitDirectory,
    rapidsnark,
    outputDir,
    blocksPerBatch,
    startBlock,
    endBlock,
    maciStateFile,
    signer,
    quiet,
  } = args;
}

describe("e2e", function test() {
  this.timeout(90000000);

  let QVMaciStrategy: QVMACI;
  let QVMaciStrategyAddress: string;
  let token: ERC20;

  let owner: Signer;
  let allocator: Signer;
  let recipient1: Signer;
  let recipient2: Signer;
  let ownerAddress: string;

  // create a new user keypair
  const keypair = new Keypair();
  const coordinatorKeypair = new Keypair();

  let iface: QVMACIInterface;
  let ifaceClonableMACI: ClonableMACIInterface;
  let verifierContract: MockVerifier;
  let vkRegistryContract: VkRegistry;
  let maciContract: ClonableMACI;
  let pollContract: ClonablePoll;
  let tallyContract: ClonableTally;
  let mpContract: ClonableMessageProcessor;
  let AlloContract: Allo;

  const signupAmount = 100_000_000_000_000n;

  before(async () => {
    [owner] = await ethers.getSigners();

    ownerAddress = await owner.getAddress();

    const contracts = await deployTestContracts();

    AlloContract = contracts.Allo;
    QVMaciStrategy = contracts.QVMACI_STRATEGY;
    pollContract = contracts.pollContract;
    verifierContract = contracts.verifierContract;
    vkRegistryContract = contracts.vkRegistryContract;
    maciContract = contracts.maciContract;
    QVMaciStrategyAddress = await QVMaciStrategy.getAddress();
    allocator = contracts.user1;
    recipient1 = contracts.user2;
    recipient2 = contracts.user3;

    iface = QVMaciStrategy.interface;
    ifaceClonableMACI = maciContract.interface;
  });

  describe("deployment", function () {
    it("should have deployed a new MinimalQf instance", async () => {
      expect(await QVMaciStrategy.getAddress()).to.not.be.undefined;
      expect(await maciContract.stateTreeDepth()).to.eq(6n);
    });
  });

  describe("Add Allocator", () => {
    it("Pool Admin should allowlist an allocator", async () => {
      const tx = await QVMaciStrategy.addAllocator(
        await allocator.getAddress(),
      );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);

      // emit AllocatorAdded(_allocator, msg.sender);

      // Store the state index
      const log = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(
        log as unknown as { topics: string[]; data: string },
      ) as unknown as {
        args: {
          allocator: string;
          sender: string;
        };
      };

      expect(event.args.sender).to.eq(ownerAddress);
      expect(event.args.allocator).to.eq(await allocator.getAddress());
    });
  });

  describe("signup", () => {
    it("should allow to signup an allowed allocator", async () => {
      const tx = await QVMaciStrategy.connect(allocator).signup(
        keypair.pubKey.asContractParam(),
      );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);

      // Store the state index
      const log = receipt!.logs[receipt!.logs.length - 1];
      const event = ifaceClonableMACI.parseLog(
        log as unknown as { topics: string[]; data: string },
      ) as unknown as {
        args: {
          _stateIndex: BigNumberish;
          _voiceCreditBalance: BigNumberish;
        };
      };

      expect(event.args._stateIndex).to.eq(1n);
      expect(event.args._voiceCreditBalance).to.eq(100n);
    });
  });

  describe("registerRecipient", () => {
    it("should allow anyone to register their project", async () => {
      let recipientAddress = await recipient1.getAddress();
      let data = AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "(uint256,string)"],
        [recipientAddress, ZeroAddress, [1n, "Project 1"]],
      );
      const tx = await AlloContract.connect(recipient1).registerRecipient(
        1n,
        data,
      );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
      // event Registered(address indexed recipientId, bytes data, address sender);

      // Store the state index
      const log = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(
        log as unknown as { topics: string[]; data: string },
      ) as unknown as {
        args: {
          recipientId: string;
          data: BytesLike;
          sender: string;
        };
      };

      expect(event.args.recipientId).to.eq(recipientAddress);
      expect(event.args.data).to.eq(data);
      expect(event.args.sender).to.eq(recipientAddress);
    });
  });

  describe("reviewRecipient", () => {
    it("should allow the pool admin to review the project recipient", async () => {
      let recipientAddress = await recipient1.getAddress();
      let status = 2; // Accepted

      const tx = await QVMaciStrategy.connect(owner).reviewRecipients(
        [recipientAddress],
        [status],
      );

      // const votingIndexBytes = AbiCoder.defaultAbiCoder().encode(["address"], [recipientAddress])
      // const votingIndex = ethers.utils.keccak256(votingIndexBytes) as BytesLike

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);

      const votingOption =
        await QVMaciStrategy.connect(owner).recipientIdToIndex(
          recipientAddress,
        );

      // event RecipientVotingOptionAdded(address recipientId, uint256 recipientIndex);

      const log = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(
        log as unknown as { topics: string[]; data: string },
      ) as unknown as {
        args: {
          recipientId: string;
          recipientIndex: BytesLike;
        };
      };

      expect(event.args.recipientId).to.eq(recipientAddress);
      // expect(event.args.recipientIndex).to.eq(votingOption)
    });
  });

  describe("publish message", () => {
    it("should allow to publish a message", async () => {
      const keypair = new Keypair();

      let recipientAddress = await recipient1.getAddress();

      const votingOption =
        await QVMaciStrategy.connect(owner).recipientIdToIndex(
          recipientAddress,
        );

      const command = new PCommand(
        1n,
        keypair.pubKey,
        votingOption,
        9n,
        1n,
        0n,
        0n,
      );

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(
        keypair.privKey,
        coordinatorKeypair.pubKey,
      );
      const message = command.encrypt(signature, sharedKey);
      await pollContract
        .connect(allocator)
        .publishMessage(message, keypair.pubKey.asContractParam());
    });

    it("should allow to publish a batch of messages", async () => {
      const keypair = new Keypair();

      let recipientAddress = await recipient1.getAddress();

      const votingOption =
        await QVMaciStrategy.connect(owner).recipientIdToIndex(
          recipientAddress,
        );

      const command = new PCommand(
        1n,
        keypair.pubKey,
        votingOption,
        9n,
        1n,
        0n,
        0n,
      );

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(
        keypair.privKey,
        coordinatorKeypair.pubKey,
      );
      const message = command.encrypt(signature, sharedKey);

      const messages = new Array(10).fill(message.asContractParam());
      const keys = new Array(10).fill(keypair.pubKey.asContractParam());

      await pollContract
        .connect(allocator)
        .publishMessageBatch(messages, keys, { gasLimit: 30000000 });
    });
  });

  // describe("recipientRegistry", () => {
  //     it("should allow the owner to add a recipient", async () => {
  //         await recipientRegistry.addRecipient(0n, ownerAddress)
  //     })
  //     it("should allow the owner to add multiple recipients", async () => {
  //         await recipientRegistry.addRecipients([ownerAddress, ownerAddress, ownerAddress])
  //     })
  //     it("should throw if the caller is not the owner", async () => {
  //         await expect(recipientRegistry.connect(user).addRecipient(0n, ownerAddress)).to.be.revertedWith(
  //             "Ownable: caller is not the owner",
  //         )
  //     })
  // })

  // describe("getMatchingFunds", () => {
  //     it("should return the correct amount of matching funds (amount in the contract)", async () => {
  //         const funds = await minimalQF.getMatchingFunds()
  //         expect(funds).to.eq(signupAmount)
  //     })

  //     it("should return the correct amount of matching funds (amount in the contract + approved tokens by funding source)", async () => {
  //         await token.connect(owner).approve(minimalQFAddress, signupAmount)
  //         const funds = await minimalQF.getMatchingFunds()
  //         expect(funds).to.eq(signupAmount * 2n)
  //     })
  // })

  // describe("cancelRound", () => {
  //     it("should prevent a non owner from cancelling a round", async () => {
  //         const tally = await minimalQF.tally()
  //         const contract = await ethers.getContractAt("MinimalQFTally", tally)
  //         await expect(contract.connect(user).cancelRound()).to.be.revertedWith("Ownable: caller is not the owner")
  //     })
  //     it("should allow the owner to cancel a round", async () => {
  //         const tally = await minimalQF.tally()
  //         const contract = await ethers.getContractAt("MinimalQFTally", tally)
  //         await contract.cancelRound()

  //         expect(await contract.isCancelled()).to.eq(true)
  //     })
  // })

  describe("finalize", () => {
    let mpContract: MessageProcessor;

    let tallyData: ITallyCircuitInputs;

    const maciState = new MaciState(STATE_TREE_DEPTH);
    let poll: Poll;

    let QVMaciStrategy: QVMACI;
    let QVMaciStrategyAddress: string;

    let owner: Signer;
    let allocator: Signer;
    let recipient1: Signer;
    let recipient2: Signer;
    let ownerAddress: string;

    // create a new user keypair
    const keypair = new Keypair();
    const coordinatorKeypair = new Keypair();
    let proofOutputDirectory = "proofs";
    let DEFAULT_SR_QUEUE_OPS = "100";
    let DEFAULT_GET_LOG_BATCH_SIZE = 1000;
    let maciTransactionHash = "0x0";
    let iface: QVMACIInterface;
    let ifaceClonableMACI: ClonableMACIInterface;
    let verifierContract: MockVerifier;
    let vkRegistryContract: VkRegistry;
    let maciContract: ClonableMACI;
    let pollContract: ClonablePoll;
    let tallyContract: ClonableTally;
    let AlloContract: Allo;

    let deployTime: number;

    before(async () => {
      [owner] = await ethers.getSigners();

      ownerAddress = await owner.getAddress();

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

      iface = QVMaciStrategy.interface;
      ifaceClonableMACI = maciContract.interface;

      const deployTime = contracts.poolDeployTime || 0;

      const pollId = maciState.deployPoll(
        BigInt(deployTime) + 500n,
        maxValues,
        {
          ...treeDepths,
          intStateTreeDepth: treeDepths.intStateTreeDepth,
        },
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;

      let _mpContract = mpContract.connect(owner);

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

      // Register recipient
      let recipientAddress = await recipient1.getAddress();
      let data = AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "(uint256,string)"],
        [recipientAddress, ZeroAddress, [1n, "Project 1"]],
      );
      const RecipientRegistrationTx = await AlloContract.connect(
        recipient1,
      ).registerRecipient(1n, data);
      await RecipientRegistrationTx.wait();

      // Review Acccept recipient
      let status = 2; // Accepted
      const ReviewRecipientTx = await QVMaciStrategy.connect(
        owner,
      ).reviewRecipients([recipientAddress], [status]);
      await ReviewRecipientTx.wait();

      // create 1 message for the recipient
      const votingOption =
        await QVMaciStrategy.connect(owner).recipientIdToIndex(
          recipientAddress,
        );
      const command = new PCommand(
        1n,
        keypair.pubKey,
        votingOption,
        9n,
        1n,
        0n,
        0n,
      );
      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(
        keypair.privKey,
        coordinatorKeypair.pubKey,
      );
      const message = command.encrypt(signature, sharedKey);
      const messageContractParam = message.asContractParam();

      // update the poll state
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // merge the trees
      const _pollContract = pollContract.connect(owner);

      // publish message on chain and locally
      const nothing = new Message(1n, [
        8370432830353022751713833565135785980866757267633941821328460903436894336785n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ]);

      const encP = new PubKey([
        10457101036533406547632367118273992217979173478358440826365724437999023779287n,
        19824078218392094440610104313265183977899662750282163392862422243483260492317n,
      ]);
      poll.publishMessage(nothing, encP);

      poll.publishMessage(message, keypair.pubKey);

      await _pollContract.publishMessage(
        messageContractParam,
        keypair.pubKey.asContractParam(),
      );

      await timeTravel(owner.provider as unknown as EthereumProvider, 600);

      await _pollContract.mergeMaciStateAqSubRoots(0n, 0n);
      await _pollContract.mergeMaciStateAq(0n);

      await _pollContract.mergeMessageAqSubRoots(0n);
      await _pollContract.mergeMessageAq();

      const processMessagesInputs = poll.processMessages(pollId);

      await _mpContract.processMessages(
        processMessagesInputs.newSbCommitment,
        [0, 0, 0, 0, 0, 0, 0, 0],
      );

      const maciAddress = await maciContract.getAddress();
      await mergeMaciSubtrees({
        maciAddress,
        pollId,
        numQueueOps: DEFAULT_SR_QUEUE_OPS,
        signer: owner,
      });

      const random = Math.floor(Math.random() * 10 ** 8);
      const outputDir = path.join(proofOutputDirectory, `${random}`);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // past an end block that's later than the MACI start block
      const genProofArgs = getGenProofArgs({
        maciAddress,
        pollId,
        coordinatorMacisk: coordinatorKeypair.privKey.serialize(),
        rapidsnark,
        circuitType: circuit,
        circuitDirectory,
        outputDir,
        blocksPerBatch: DEFAULT_GET_LOG_BATCH_SIZE,
        maciTxHash: maciTransactionHash,
        signer: owner,
        quiet,
      });

      await genProofs(genProofArgs);

      const tallyAddress = await tallyContract.getAddress();
      const messageProcessorAddress = await mpContract.getAddress();

      let quiet = true as any;

      // Submit proofs to MACI contract
      await proveOnChain({
        pollId,
        proofDir: genProofArgs?.outputDir || "",
        subsidyEnabled: false,
        maciAddress,
        messageProcessorAddress,
        tallyAddress,
        signer: owner,
        quiet,
        // true
      });

      console.log("finished proveOnChain");

      const tally = JSONFile.read(genProofArgs?.tallyFile) as any;
      const tallyHash = await getIpfsHash(tally);
      await QVMaciStrategy.connect(owner).publishTallyHash(tallyHash);
      console.log("Tally hash", tallyHash);

      // add tally results to funding round
      const recipientTreeDepth = treeDepths.voteOptionTreeDepth;
      console.log("Adding tally result on chain in batches of", tallyBatchSize);
      await addTallyResultsBatch(
        QVMaciStrategy.connect(owner) as QVMACI,
        recipientTreeDepth,
        tally,
        tallyBatchSize,
      );
      console.log("Finished adding tally results");
    });

    // it("should throw when not called by the MinimalQF contract", async () => {
    //     const tally = await minimalQF.tally()
    //     const contract = await ethers.getContractAt("MinimalQFTally", tally, user)
    //     await expect(contract.finalize(5, 5, 5, 5)).to.be.revertedWithCustomError(contract, "OnlyMinimalQF")
    // })

    // it("should throw when the round is cancelled", async () => {
    //     const tally = await minimalQF.tally()
    //     const contract = await ethers.getContractAt("MinimalQFTally", tally, user)
    //     await expect(minimalQF.transferMatchingFunds(5, 5, 5, 5)).to.be.revertedWithCustomError(
    //         contract,
    //         "RoundCancelled",
    //     )
    // })

    // it("should throw when the ballots have not been tallied yet", async () => {
    //     const tally = await newMinimalQf.tally()
    //     const contract = await ethers.getContractAt("MinimalQFTally", tally, user)
    //     expect(await contract.isTallied()).to.eq(false)

    //     await expect(newMinimalQf.transferMatchingFunds(5, 5, 5, 5)).to.be.revertedWithCustomError(
    //         contract,
    //         "BallotsNotTallied",
    //     )
    // })

    // it("should throw when the spent voice credit proof is wrong", async () => {
    //     // tally the ballots

    //     const tally = await newMinimalQf.tally()
    //     const contract = await ethers.getContractAt("MinimalQFTally", tally, owner)

    //     tallyData = poll.tallyVotes()
    //     await contract.tallyVotes(tallyData.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0])

    //     expect(await contract.isTallied()).to.eq(true)

    //     await expect(newMinimalQf.transferMatchingFunds(5, 5, 5, 5)).to.be.revertedWithCustomError(
    //         contract,
    //         "InvalidSpentVoiceCreditsProof",
    //     )
    // })

    it("should allow the Pool Manager to finalize the round", async () => {
      tallyData = poll.tallyVotes();

      const tally = tallyContract.connect(owner);

      await tally.tallyVotes(
        tallyData.newTallyCommitment,
        [0, 0, 0, 0, 0, 0, 0, 0],
      );

      expect(await tally.isTallied()).to.eq(true);

      // compute newResultsCommitment
      const newResultsCommitment = genTreeCommitment(
        poll.tallyResult.map((x) => BigInt(x)),
        BigInt(tallyData.newResultsRootSalt),
        treeDepths.voteOptionTreeDepth,
      );

      const newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
        poll.perVOSpentVoiceCredits.map((x) => BigInt(x)),
        BigInt(tallyData.newPerVOSpentVoiceCreditsRootSalt!),
        treeDepths.voteOptionTreeDepth,
      );

      await QVMaciStrategy.finalize(
        poll.totalSpentVoiceCredits,
        tallyData.newSpentVoiceCreditSubtotalSalt,
        newResultsCommitment,
        newPerVOSpentVoiceCreditsCommitment,
      );
    });

    // it("should not allow to finalize twice", async () => {
    //     const tally = await newMinimalQf.tally()
    //     const contract = await ethers.getContractAt("MinimalQFTally", tally, user)
    //     await expect(newMinimalQf.transferMatchingFunds(5, 5, 5, 5)).to.be.revertedWithCustomError(
    //         contract,
    //         "AlreadyFinalized",
    //     )
    // })
  });
});
