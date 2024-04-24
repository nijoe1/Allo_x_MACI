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
import type { NonPayableOverrides } from "../../../../common";
import type {
  PoseidonT5,
  PoseidonT5Interface,
} from "../../../../maci-contracts/contracts/crypto/PoseidonT5";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256[4]",
        name: "input",
        type: "uint256[4]",
      },
    ],
    name: "poseidon",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x61011761003a600b82828239805160001a60731461002d57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe730000000000000000000000000000000000000000301460806040526004361060335760003560e01c8063248f6677146038575b600080fd5b60496043366004605b565b50600090565b60405190815260200160405180910390f35b600060808284031215606c57600080fd5b82601f830112607a57600080fd5b6040516080810181811067ffffffffffffffff8211171560aa57634e487b7160e01b600052604160045260246000fd5b60405280608084018581111560be57600080fd5b845b8181101560d657803583526020928301920160c0565b50919594505050505056fea2646970667358221220b69b82fc156a765c17f08db38bc44f9822c64b7c35c81e630e12590962d937b564736f6c63430008130033";

type PoseidonT5ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PoseidonT5ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PoseidonT5__factory extends ContractFactory {
  constructor(...args: PoseidonT5ConstructorParams) {
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
      PoseidonT5 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): PoseidonT5__factory {
    return super.connect(runner) as PoseidonT5__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PoseidonT5Interface {
    return new Interface(_abi) as PoseidonT5Interface;
  }
  static connect(address: string, runner?: ContractRunner | null): PoseidonT5 {
    return new Contract(address, _abi, runner) as unknown as PoseidonT5;
  }
}
