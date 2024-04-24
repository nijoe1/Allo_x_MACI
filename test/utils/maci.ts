import { ContractTransactionReceipt, Signer, ethers } from "ethers";
import {
  genTreeCommitment as genTallyResultCommitment,
  genRandomSalt,
  IncrementalQuinTree,
  hashLeftRight,
  hash5,
  hash3,
  hash2,
} from "maci-crypto";

import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";

import * as os from "os";
import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
  GenProofsArgs,
  genLocalState,
  verify,
} from "maci-cli";

import { getTalyFilePath, isPathExist } from "./misc";
import { getCircuitFiles } from "./circuits";
import { QVMACI } from "../../typechain-types";

// /**
//  * Maci tally file interface
//  */
// interface Tally {
//   provider: string;
//   maci: string;
//   pollId: string;
//   newTallyCommitment: string;
//   results: {
//       commitment: string;
//       tally: string[];
//       salt: string;
//   };
//   totalSpentVoiceCredits: {
//       spent: string;
//       commitment: string;
//       salt: string;
//   };
//   perVOSpentVoiceCredits: {
//       commitment: string;
//       tally: string[];
//       salt: string;
//   };
// }

// interface TallyResultProof {
//     recipientIndex: number
//     result: string
//     proof: bigint[][]
// }
export const isOsArm = os.arch().includes("arm");

const LEAVES_PER_NODE = 5;
function createMessage(
  userStateIndex,
  userKeypair,
  newUserKeypair,
  coordinatorPubKey,
  voteOptionIndex,
  voiceCredits,
  nonce,
  pollId,
  salt,
) {
  const encKeypair = newUserKeypair ? newUserKeypair : userKeypair;
  if (!salt) {
    salt = genRandomSalt();
  }
  const quadraticVoteWeight = voiceCredits;
  const command = new PCommand(
    BigInt(userStateIndex),
    encKeypair.pubKey,
    BigInt(voteOptionIndex || 0),
    quadraticVoteWeight,
    BigInt(nonce),
    pollId,
    salt,
  );
  const signature = command.sign(userKeypair.privKey);
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey),
  );
  return [message, encKeypair.pubKey];
}
function getRecipientClaimData(recipientIndex, recipientTreeDepth, tally) {
  const maxRecipients = tally.perVOSpentVoiceCredits.tally.length;
  if (recipientIndex >= maxRecipients) {
    throw new Error(`Invalid recipient index ${recipientIndex}.`);
  }
  // Create proof for total amount of spent voice credits
  const spent = tally.perVOSpentVoiceCredits.tally[recipientIndex];
  const spentSalt = tally.perVOSpentVoiceCredits.salt;
  const spentTree = new IncrementalQuinTree(
    recipientTreeDepth,
    BigInt(0),
    LEAVES_PER_NODE,
    hash5,
  );
  for (const leaf of tally.perVOSpentVoiceCredits.tally) {
    spentTree.insert(BigInt(leaf));
  }
  const spentProof = spentTree.genProof(recipientIndex);
  const resultsCommitment = genTallyResultCommitment(
    tally.results.tally.map((x) => BigInt(x)),
    BigInt(tally.results.salt),
    recipientTreeDepth,
  );
  const spentVoiceCreditsCommitment = hash2([
    BigInt(tally.totalSpentVoiceCredits.spent),
    BigInt(tally.totalSpentVoiceCredits.salt),
  ]);
  return [
    recipientIndex,
    spent,
    spentProof.pathElements.map((x) => x.map((y) => y.toString())),
    spentSalt,
    resultsCommitment,
    spentVoiceCreditsCommitment,
  ];
}

// function createMessage(
//     userStateIndex: number,
//     userKeypair: Keypair,
//     newUserKeypair: Keypair | null,
//     coordinatorPubKey: PubKey,
//     voteOptionIndex: number | null,
//     voiceCredits: bigint | null,
//     nonce: number,
//     pollId: bigint,
//     salt?: bigint,
// ) {
//     const votingOption = voteOptionIndex == null ? 0n : BigInt(voteOptionIndex)
//     const keypair = new Keypair()

//     const command = new PCommand(1n, keypair.pubKey, votingOption, 9n, 1n, 0n, 0n)

//     const signature = command.sign(keypair.privKey)
//     const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinatorPubKey.pubKey)
//     const message = command.encrypt(signature, sharedKey)
//     // const message = new Message(
//     //     userStateIndex,
//     //     userKeypair.pubKey,
//     //     newUserKeypair?.pubKey,
//     //     coordinatorPubKey,
//     //     voteOptionIndex,
//     //     voiceCredits,
//     //     nonce,
//     //     pollId,
//     //     salt,
//     // )
//     return { message, keypair }
// }

export function getTallyResultProof(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any,
) {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex];
  if (result == null) {
    // result is null or undefined
    throw Error(`Missing tally result for index ${recipientIndex}`);
  }

  const resultTree = new IncrementalQuinTree(
    recipientTreeDepth,
    BigInt(0),
    LEAVES_PER_NODE,
    hash5,
  );
  for (const leaf of tally.results.tally) {
    resultTree.insert(BigInt(leaf));
  }
  const resultProof = resultTree.genProof(recipientIndex);
  return {
    recipientIndex,
    result,
    proof: resultProof.pathElements,
  };
}

export function getTallyResultProofBatch(
  recipientStartIndex: number,
  recipientTreeDepth: number,
  tally: any,
  batchSize: number,
) {
  const tallyCount = tally.results.tally.length;
  if (recipientStartIndex >= tallyCount) {
    throw new Error("Recipient index out of bound");
  }

  const proofs = [] as any;
  const lastIndex =
    recipientStartIndex + batchSize > tallyCount
      ? tallyCount
      : recipientStartIndex + batchSize;

  for (let i = recipientStartIndex; i < lastIndex; i++) {
    proofs.push(getTallyResultProof(i, recipientTreeDepth, tally));
  }

  return proofs;
}

export async function addTallyResultsBatch(
  QVMACI: QVMACI,
  recipientTreeDepth: number,
  tallyData: any,
  batchSize: number,
  startIndex = 0,
  callback?: (processed: number, receipt: ContractTransactionReceipt) => void,
): Promise<number> {
  let totalGasUsed = 0;
  const { tally } = tallyData.results;

  const spentVoiceCreditsHash = hashLeftRight(
    BigInt(tallyData.totalSpentVoiceCredits.spent),
    BigInt(tallyData.totalSpentVoiceCredits.salt),
  );

  const perVOSpentVoiceCreditsHash = genTallyResultCommitment(
    tallyData.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
    BigInt(tallyData.perVOSpentVoiceCredits.salt),
    recipientTreeDepth,
  );

  const newResultCommitment = genTallyResultCommitment(
    tally.map((x: string) => BigInt(x)),
    BigInt(tallyData.results.salt),
    recipientTreeDepth,
  );

  const newTallyCommitment = hash3([
    newResultCommitment,
    spentVoiceCreditsHash,
    perVOSpentVoiceCreditsHash,
  ]);

  if ("0x" + newTallyCommitment.toString(16) !== tallyData.newTallyCommitment) {
    console.error(
      "Error: the newTallyCommitment is invalid.",
      "0x" + newTallyCommitment.toString(16),
      tallyData.newTallyCommitment,
    );
  }

  for (let i = startIndex; i < tally.length; i = i + batchSize) {
    const proofs = getTallyResultProofBatch(
      i,
      recipientTreeDepth,
      tallyData,
      batchSize,
    );
    let encodedData = [] as any;
    let proof = proofs[0];
    for (let i = 0; i < proofs.length; i++) {
      proof = proofs[i];
      let data = [
        proof.recipientIndex,
        proof.result,
        proof.proof,
        BigInt(tallyData.results.salt),
        spentVoiceCreditsHash,
        BigInt(perVOSpentVoiceCreditsHash),
      ] as any;
      encodedData.push(
        // @ts-ignore
        (await QVMACI._addTallyResult.populateTransaction(data)).data
      );
    }

    const tx = await QVMACI.multicall(encodedData);
    const receipt = await tx.wait();
    if (receipt?.status !== 1) {
      throw new Error("Failed to add tally results on chain");
    }

    if (callback) {
      // the 2nd element in the data array has the array of
      // recipients to be processed for the batch
      const totalProcessed = i + proofs.length;
      callback(totalProcessed, receipt);
    }
    totalGasUsed = totalGasUsed + Number(receipt.gasUsed);
  }
  return totalGasUsed;
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

/*
 * Get the arguments to pass to the genProof function
 */
export function getGenProofArgs(args: getGenProofArgsInput): GenProofsArgs {
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

  const tallyFile = getTalyFilePath(outputDir);

  const {
    processZkFile,
    tallyZkFile,
    processWitness,
    processWasm,
    processDatFile,
    tallyWitness,
    tallyWasm,
    tallyDatFile,
  } = getCircuitFiles(circuitType, circuitDirectory);

  if (isOsArm) {
    return {
      outputDir,
      tallyFile,
      tallyZkey: tallyZkFile,
      processZkey: processZkFile,
      pollId,
      coordinatorPrivKey: coordinatorMacisk,
      maciAddress,
      transactionHash: maciTxHash,
      processWasm,
      tallyWasm,
      useWasm: true,
      blocksPerBatch,
      startBlock,
      endBlock,
      stateFile: maciStateFile,
      signer,
      quiet,
    };
  } else {
    if (!rapidsnark) {
      throw new Error("Please specify the path to the rapidsnark binary");
    }

    if (!isPathExist(rapidsnark)) {
      throw new Error(`Path ${rapidsnark} does not exist`);
    }

    return {
      outputDir,
      tallyFile,
      tallyZkey: tallyZkFile,
      processZkey: processZkFile,
      pollId,
      processWitgen: processWitness,
      processDatFile,
      tallyWitgen: tallyWitness,
      tallyDatFile,
      coordinatorPrivKey: coordinatorMacisk,
      maciAddress,
      transactionHash: maciTxHash,
      rapidsnark,
      useWasm: false,
      blocksPerBatch,
      startBlock,
      endBlock,
      stateFile: maciStateFile,
      signer,
      quiet,
    };
  }
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

/**
 * Create a random MACI private key
 *
 * @returns MACI serialized private key
 */
export function newMaciPrivateKey(): string {
  const keypair = new Keypair();
  const secretKey = keypair.privKey.serialize();
  return secretKey;
}

export {
  createMessage,
  getRecipientClaimData,
  genProofs,
  proveOnChain,
  verify,
  genLocalState,
};
