/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../../common";
import type {
  Contrants,
  ContrantsInterface,
} from "../../../../../contracts/strategies/qv-maci/interfaces/Contrants";

const _abi = [
  {
    inputs: [],
    name: "EmptyTallyHash",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
    ],
    name: "IncompleteTallyResults",
    type: "error",
  },
  {
    inputs: [],
    name: "IncorrectPerVOSpentVoiceCredits",
    type: "error",
  },
  {
    inputs: [],
    name: "IncorrectSpentVoiceCredits",
    type: "error",
  },
  {
    inputs: [],
    name: "IncorrectTallyResult",
    type: "error",
  },
  {
    inputs: [],
    name: "MaciNotSet",
    type: "error",
  },
  {
    inputs: [],
    name: "NoVotes",
    type: "error",
  },
  {
    inputs: [],
    name: "NotCoordinator",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyMaciCanRegisterVoters",
    type: "error",
  },
  {
    inputs: [],
    name: "RoundAlreadyFinalized",
    type: "error",
  },
  {
    inputs: [],
    name: "TallyHashNotPublished",
    type: "error",
  },
  {
    inputs: [],
    name: "UserNotVerified",
    type: "error",
  },
  {
    inputs: [],
    name: "VoteResultsAlreadyVerified",
    type: "error",
  },
  {
    inputs: [],
    name: "VotesNotTallied",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipientId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "votes",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "allocator",
        type: "address",
      },
    ],
    name: "Allocated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "allocator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "AllocatorAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "allocator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "AllocatorRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "maci",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "poll",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "messageProcessor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tally",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "subsidy",
        type: "address",
      },
    ],
    name: "MaciSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipientId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum IStrategy.Status",
        name: "status",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RecipientStatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "recipientId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "recipientIndex",
        type: "uint256",
      },
    ],
    name: "RecipientVotingOptionAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipientId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum IStrategy.Status",
        name: "status",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "Reviewed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "tallyHash",
        type: "string",
      },
    ],
    name: "TallyPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "voteOptionIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tally",
        type: "uint256",
      },
    ],
    name: "TallyResultsAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "registrationStartTime",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "registrationEndTime",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "allocationStartTime",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "allocationEndTime",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "TimestampsUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipientId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum IStrategy.Status",
        name: "status",
        type: "uint8",
      },
    ],
    name: "UpdatedRegistration",
    type: "event",
  },
  {
    inputs: [],
    name: "TREE_ARITY",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6080604052348015600f57600080fd5b50607c8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634b34e02114602d575b600080fd5b6034600581565b60405190815260200160405180910390f3fea2646970667358221220f032e578527ba7afce126ecaa50c93d2e134dc596cdc1b7ac5f8804e52c2d31f64736f6c63430008130033";

type ContrantsConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ContrantsConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Contrants__factory extends ContractFactory {
  constructor(...args: ContrantsConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      Contrants & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Contrants__factory {
    return super.connect(runner) as Contrants__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ContrantsInterface {
    return new Interface(_abi) as ContrantsInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Contrants {
    return new Contract(address, _abi, runner) as unknown as Contrants;
  }
}
