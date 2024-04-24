/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BigNumberish,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../../../common";
import type {
  AccQueueQuinaryBlankSl,
  AccQueueQuinaryBlankSlInterface,
} from "../../../../maci-contracts/contracts/trees/AccQueueQuinaryBlankSl";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_subDepth",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "DepthCannotBeZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_depth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "max",
        type: "uint256",
      },
    ],
    name: "DepthTooLarge",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_depth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "min",
        type: "uint256",
      },
    ],
    name: "DepthTooSmall",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidHashLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "InvalidIndex",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidLevel",
    type: "error",
  },
  {
    inputs: [],
    name: "NothingToMerge",
    type: "error",
  },
  {
    inputs: [],
    name: "SubDepthCannotBeZero",
    type: "error",
  },
  {
    inputs: [],
    name: "SubTreesAlreadyMerged",
    type: "error",
  },
  {
    inputs: [],
    name: "SubTreesNotMerged",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_subDepth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "max",
        type: "uint256",
      },
    ],
    name: "SubdepthTooLarge",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_DEPTH",
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
  {
    inputs: [],
    name: "calcMinHeight",
    outputs: [
      {
        internalType: "uint256",
        name: "depth",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_leaf",
        type: "uint256",
      },
    ],
    name: "enqueue",
    outputs: [
      {
        internalType: "uint256",
        name: "leafIndex",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "fill",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_depth",
        type: "uint256",
      },
    ],
    name: "getMainRoot",
    outputs: [
      {
        internalType: "uint256",
        name: "mainRoot",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSmallSRTroot",
    outputs: [
      {
        internalType: "uint256",
        name: "smallSubTreeRoot",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSrIndices",
    outputs: [
      {
        internalType: "uint256",
        name: "next",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "current",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "getSubRoot",
    outputs: [
      {
        internalType: "uint256",
        name: "subRoot",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[2]",
        name: "array",
        type: "uint256[2]",
      },
    ],
    name: "hash2",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[3]",
        name: "array",
        type: "uint256[3]",
      },
    ],
    name: "hash3",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[4]",
        name: "array",
        type: "uint256[4]",
      },
    ],
    name: "hash4",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[5]",
        name: "array",
        type: "uint256[5]",
      },
    ],
    name: "hash5",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "left",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "right",
        type: "uint256",
      },
    ],
    name: "hashLeftRight",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_level",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_leaf",
        type: "uint256",
      },
    ],
    name: "hashLevelLeaf",
    outputs: [
      {
        internalType: "uint256",
        name: "hashed",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_subRoot",
        type: "uint256",
      },
    ],
    name: "insertSubTree",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_depth",
        type: "uint256",
      },
    ],
    name: "merge",
    outputs: [
      {
        internalType: "uint256",
        name: "root",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_numSrQueueOps",
        type: "uint256",
      },
    ],
    name: "mergeSubRoots",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "numLeaves",
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
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "array",
        type: "uint256[]",
      },
    ],
    name: "sha256Hash",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "subTreesMerged",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treeMerged",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60e06040523480156200001157600080fd5b506040516200231f3803806200231f833981016040819052620000349162000618565b808060056200004333620005c8565b81600003620000655760405163682e504160e11b815260040160405180910390fd5b60208211156200009657604051637ccdcc9760e11b8152600481018390526020602482015260440160405180910390fd5b80600214158015620000a9575080600514155b15620000c857604051636f7b6c0360e01b815260040160405180910390fd5b6000805460ff60a01b191660028314600160a01b02179055608082905260a0819052620000f6828262000747565b60c05250507f0ef71f46e11a513c599eed9dd03576c33439bcfb1cee155316f90541e41649ba6101725550507f0404a2ed0a1df2006441895d9a65ffffdd4968cb5f555fe72a6da7aaec83e1a0610173557f0b1c3d09dd575749a374a9dc1ee32af8c2312e24ad33a3e40fce8120b0f25fe3610174557f1f60ed72fc1915366d2e52cfc7ddc0ff854c7aee9abbc07d1ca88ada842354dc610175557f2ca1efc603fc121baf791319195ee3ab7fa075cee664d008f9ab2870f5028360610176557f2a0381fc4fb108733dfc58c355f2de753bcde61bd988eaa7d33fc967262be5ad610177557f12c6c7cce0332367373dafc95d75b98dd58980410434929dff09466a4ba262db610178557f2f212d3cc7e7334c4a10ced1be011b9cd70f73cca5522fc4137a51be8a17d18e610179557f0968ef20d515d8d743b2cf66603f8b86f3fdeee932fdc911774bb8699566e11c61017a557f2e3604981890fb676c3dac1e14c5c201573f99d1b9e67025109baf274b10e9dd61017b557f147d317fd4b7a1dd6cb961cfba444466b3c431ea638c8df74a89fc591d1a3a5161017c557f10ea2b72952b619afd5b9bc50561df8de0c6e1ba9b5ad66b179c39c420304a7561017d557f1c49f7b357d244d9144676ad23f79465ef5b88ef0f91762a3d35997688af9a5a61017e557f05ca0cfef8158efc5c4af44122e2765179b5463618d5c5ac6185c192332cade961017f557f0ae1595634e8a2e23620f33f9b2b5a23387a28f5833814646900110842f3a109610180557f08be8c2a6a099d9cdc96f9197af6ad99595d73419eb0694eaea432fa18baa203610181557f207f689ce35cf857ee6e68c42d31bb2191d1e84d7a295ccd63995ca7369d20eb610182557f2a6f6b7e4a2cd1a6466ed17debb0a27904e99adbd72be85566a87340f41efd05610183557f0f0725795350566920bbf56d3f22c4d38e832e638c9cb91811f83194e9dd74be610184557f02cd50632e5c5b00a9a93f434797725ec0f85f11ba1b6a844f0cd10c70df6392610185557f08868b85d2fa4c17eec0a7d8bca4671a00474bff80e801981437b77aa11d10b5610186557f294a84b7b46ea0a781877a2c0efd1ee56758d9ee55722721867efe53f4645286610187557f02cb8070979a018bb919f0d1a25d5ad3d5a376c4cf66f36d33434d221ca77e88610188557f05dfce8303f471d776762f2ddd37f05191b8bf5064d8d28e892cd4ec21e7aab4610189557f28a47617aa1e26bf42fd3b26e88aa717fd759bb92b22faaf5ad82090680b523161018a557f1de9253f5fa546603817abd83d1a13c8562f2bf6a0069a546fe546ca0c03c17061018b557f1cb9bd316e341b873dbbef94fd699c6e3a638451de2817db1620235db2b6c39e61018c557f0654785b2917d7c659a95738add3d8eb51cbbefc0f521c2640bc74b0fec5816261018d557f2eed74eacf5de60a758f815cb5e73015455c38408143fc25810d03e1ec9e352461018e557f16bea3363deb4753db67be8b19110b169ae39f33113a92773c41a8b025ca5a9361018f557f2b0dd3b7e0a7e234a4a1b48dd0e9083dc8bfc8cd7f72abdb93a1b8e5ef3e22ed610190557f0bc1ca795d5a059b1dc0c51f72c46f2288cb139ebf09f38ac3e8bca0485ed497610191557f249ca1610a7f80bbf422388c18ef9777fcdab26ee718e2b39e4011973a902330610192556200075c565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000602082840312156200062b57600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b600181815b80851115620006895781600019048211156200066d576200066d62000632565b808516156200067b57918102915b93841c93908002906200064d565b509250929050565b600082620006a25750600162000741565b81620006b15750600062000741565b8160018114620006ca5760028114620006d557620006f5565b600191505062000741565b60ff841115620006e957620006e962000632565b50506001821b62000741565b5060208310610133831016604e8410600b84101617156200071a575081810a62000741565b62000726838362000648565b80600019048211156200073d576200073d62000632565b0290505b92915050565b600062000755838362000691565b9392505050565b60805160a05160c051611b156200080a600039600081816103ea01528181610a2501528181610ac201528181610c7f0152610d820152600081816103230152818161056e015281816106e401528181610bb401528181610f2b0152818161109f015261130001526000818161041a0152818161047b0152818161054401528181610bed01528181610cb801528181610d0201528181610ecc01528181610f82015261123b0152611b156000f3fe608060405234801561001057600080fd5b50600436106101585760003560e01c806381d6a24a116100c3578063c00bdbcc1161007c578063c00bdbcc146102b8578063c15da65b146102cb578063d9c55ce1146102de578063dda89a6e146102e6578063e93fb4d4146102f0578063f2fde38b1461030357600080fd5b806381d6a24a146102455780638da5cb5b146102615780639cfced971461027c578063a27154ba1461028f578063b6a64acd14610297578063bea140b3146102a557600080fd5b806358bfc3791161011557806358bfc379146101cc5780635bb93995146101df5780635bf1fa4d146101f257806362a361bb1461020557806369e7c58614610218578063715018a61461023b57600080fd5b80631b9b8aa71461015d5780631ffc735d1461018357806324a47aeb146101965780633bfa6fce146101a95780633dfb88b2146101b15780633e1a8cc1146101c4575b600080fd5b61017061016b366004611522565b610316565b6040519081526020015b60405180910390f35b610170610191366004611522565b610399565b6101706101a4366004611522565b6104c7565b6101706106d8565b6101706101bf366004611582565b610723565b6101706107a4565b6101706101da366004611600565b6107d3565b6101706101ed3660046116a6565b61086d565b6101706102003660046116a6565b610892565b6101706102133660046116c8565b610931565b61016e5461022b90610100900460ff1681565b604051901515815260200161017a565b61024361096b565b005b610170546001546040805192835260208301919091520161017a565b6000546040516001600160a01b03909116815260200161017a565b61017061028a366004611723565b61097f565b610170602081565b61016e5461022b9060ff1681565b6101706102b336600461177c565b6109b9565b6102436102c6366004611522565b6109f3565b6102436102d9366004611522565b610a6f565b610243610c75565b6101706101715481565b6101706102fe366004611522565b610dbf565b6102436103113660046117d5565b610dfa565b61017154600090610347837f00000000000000000000000000000000000000000000000000000000000000006118ff565b101561037d5761017154604051627289df60e61b8152610374918491600401918252602082015260400190565b60405180910390fd5b61014d82602181106103915761039161190b565b015492915050565b60006103a3610e70565b50610171546103b3826000610eca565b6103be816001611921565b610171556103cf61014d6000611487565b600061016f5561016e805460ff191690556101715461040f907f000000000000000000000000000000000000000000000000000000000000000090611934565b6000036104c25760027f0000000000000000000000000000000000000000000000000000000000000000602181106104495761044961190b565b600402015460018054600090815261014c602052604081209290925580549161047183611956565b90915550600290507f0000000000000000000000000000000000000000000000000000000000000000602181106104aa576104aa61190b565b6004020160008091018190556104c290608690611487565b919050565b60006104d1610e70565b816000036104f257604051630543d40760e11b815260040160405180910390fd5b61016e5460ff1661051657604051631e596e4360e11b815260040160405180910390fd5b602082111561054257604051632cd31ae960e01b81526004810183905260206024820152604401610374565b7f00000000000000000000000000000000000000000000000000000000000000005b61017154610592827f00000000000000000000000000000000000000000000000000000000000000006118ff565b10156105aa57806105a281611956565b915050610564565b808310156105d457604051627289df60e61b81526004810184905260248101829052604401610374565b8083036106105761016f5461014d84602181106105f3576105f361190b565b0155505061016e805461ff00191661010017905561016f54919050565b61016f549150805b838110156106aa57600061062b8261100b565b600054909150600160a01b900460ff161561066357610648611496565b8481526020810182905261065b81610931565b945050610697565b61066b6114b4565b848152602081018290526040810182905260608101829052608081018290526106938161097f565b9450505b50806106a281611956565b915050610618565b508161014d84602181106106c0576106c061190b565b015561016e805461ff00191661010017905550919050565b60015b600154610708827f00000000000000000000000000000000000000000000000000000000000000006118ff565b1015610720578061071881611956565b9150506106db565b90565b60405163248f667760e01b815260009073__$e61c65d9562aef5fa6ab22c0f787cf1e30$__9063248f66779061075d90859060040161196f565b602060405180830381865af415801561077a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061079e91906119a0565b92915050565b61016e5460009060ff166107cb57604051631e596e4360e11b815260040160405180910390fd5b5061016f5490565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000160028360405160200161080991906119b9565b60408051601f1981840301815290829052610823916119ef565b602060405180830381855afa158015610840573d6000803e3d6000fd5b5050506040513d601f19601f8201168201806040525081019061086391906119a0565b61079e9190611934565b6000610877611496565b8381526020810183905261088a81610931565b949350505050565b600061089c6114b4565b600284602181106108af576108af61190b565b60040201548152600284602181106108c9576108c961190b565b60040201600101548160016020020152600284602181106108ec576108ec61190b565b600402016002015481600260200201526002846021811061090f5761090f61190b565b6004020160030154816003602002015282816004602002015261088a8161097f565b6040516314d2f97b60e11b815260009073__$1540826e134b1b69b7091c82576ee3aadd$__906329a5f2f69061075d908590600401611a1e565b610973610e70565b61097d6000611021565b565b604051630926f44b60e31b815260009073__$46fbdf6658faf65265971bdad66851b86c$__90634937a2589061075d908590600401611a46565b6040516304b98e1d60e31b815260009073__$fa059fb1da6d850ca47ea49359bfe89f78$__906325cc70e89061075d908590600401611a6e565b6109fb610e70565b60018054600090815261014c6020526040812083905581549190610a1e83611956565b91905055507f00000000000000000000000000000000000000000000000000000000000000006101716000828254610a569190611921565b9091555050600061016f555061016e805460ff19169055565b610a77610e70565b61016e5460ff1615610a9c57604051630d36aec160e01b815260040160405180910390fd5b61017154600003610ac0576040516316a0341160e11b815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000061017154610aef9190611934565b15610afc57610afc610c75565b600154600103610b2557610b106000610dbf565b61016f5561016e805460ff1916600117905550565b6000610b2f6106d8565b610170549091506000905b600154811015610bab578315801590610b5257508382145b15610b5d5750505050565b610b74610b6c61017054610dbf565b600085611071565b6101708054906000610b8583611956565b91905055508180610b9590611956565b9250508080610ba390611956565b915050610b3a565b506000610bd8837f00000000000000000000000000000000000000000000000000000000000000006118ff565b90506001546101705403610c41576000610c117f000000000000000000000000000000000000000000000000000000000000000061100b565b6001549091505b82811015610c3e57610c2c82600087611071565b80610c3681611956565b915050610c18565b50505b60a78360218110610c5457610c5461190b565b600402016000015461016f55505061016e805460ff19166001179055505b50565b610c7d610e70565b7f000000000000000000000000000000000000000000000000000000000000000061017154610cac9190611934565b600003610cf457610cdc7f000000000000000000000000000000000000000000000000000000000000000061100b565b600154600090815261014c6020526040902055610d65565b610cfe6000611239565b60027f000000000000000000000000000000000000000000000000000000000000000060218110610d3157610d3161190b565b6004020154600154600090815261014c6020526040812091909155610d58906002906114d2565b610d6561014d6000611487565b60006001546001610d769190611921565b60018190559050610da77f000000000000000000000000000000000000000000000000000000000000000082611a96565b6101715550600061016f5561016e805460ff19169055565b60008160015411610de65760405163042a2e7160e11b815260048101839052602401610374565b50600090815261014c602052604090205490565b610e02610e70565b6001600160a01b038116610e675760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152608401610374565b610c7281611021565b6000546001600160a01b0316331461097d5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610374565b7f0000000000000000000000000000000000000000000000000000000000000000811115610f0b5760405163d1459f7960e01b815260040160405180910390fd5b600060868260218110610f2057610f2061190b565b01549050610f4f60017f0000000000000000000000000000000000000000000000000000000000000000611aad565b8114610fd4578260028360218110610f6957610f6961190b565b600402018260048110610f7e57610f7e61190b565b01557f00000000000000000000000000000000000000000000000000000000000000008214610fcf5760868260218110610fba57610fba61190b565b018054906000610fc983611956565b91905055505b505050565b610fde82846113a5565b925060868260218110610ff357610ff361190b565b60009101558161100281611956565b92505050610f0b565b600061017282602181106103915761039161190b565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b8082111561107e57505050565b600061012b83602181106110945761109461190b565b015490506110c360017f0000000000000000000000000000000000000000000000000000000000000000611aad565b8114611121578360a784602181106110dd576110dd61190b565b6004020182600481106110f2576110f261190b565b015561012b83602181106111085761110861190b565b01805490600061111783611956565b9190505550611233565b60008054600160a01b900460ff161561116e5761113c611496565b60a7856021811061114f5761114f61190b565b600402015481526020810186905261116681610931565b915050611203565b6111766114b4565b60005b838160ff1610156111dd5760a786602181106111975761119761190b565b600402018160ff16600481106111af576111af61190b565b0154828260ff16600581106111c6576111c661190b565b6020020152806111d581611ac0565b915050611179565b50858184600581106111f1576111f161190b565b60200201526111ff8161097f565b9150505b61012b84602181106112175761121761190b565b60009101556112318161122b866001611921565b85611071565b505b50505050565b7f0000000000000000000000000000000000000000000000000000000000000000811015610c72576000608682602181106112765761127661190b565b01549050801561137a57600061128a6114b4565b60006112958561100b565b905060005b848160ff1610156112fe57600286602181106112b8576112b861190b565b600402018160ff16600481106112d0576112d061190b565b0154838260ff16600581106112e7576112e761190b565b6020020152806112f681611ac0565b91505061129a565b7f00000000000000000000000000000000000000000000000000000000000000008160ff1610156113565781838260ff166005811061133f5761133f61190b565b60200201528061134e81611ac0565b9150506112fe565b61135f8361097f565b935061137584611370886001611921565b610eca565b505050505b6086826021811061138d5761138d61190b565b60009101558161139c81611956565b92505050611239565b60006113af6114b4565b600284602181106113c2576113c261190b565b60040201548152600284602181106113dc576113dc61190b565b60040201600101548160016020020152600284602181106113ff576113ff61190b565b60040201600201548160026020020152600284602181106114225761142261190b565b600402016003015481600360200201528281600460200201526114448161097f565b9150600284602181106114595761145961190b565b60040201600061148091905060008155600101600081556001016000815560010160009055565b5092915050565b50610c729060218101906114e1565b60405180604001604052806002906020820280368337509192915050565b6040518060a001604052806005906020820280368337509192915050565b50610c729060848101906114fa565b5b808211156114f657600081556001016114e2565b5090565b808211156114f6576000808255600182018190556002820181905560038201556004016114fa565b60006020828403121561153457600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff8111828210171561157a5761157a61153b565b604052919050565b60006080828403121561159457600080fd5b82601f8301126115a357600080fd5b6040516080810181811067ffffffffffffffff821117156115c6576115c661153b565b6040528060808401858111156115db57600080fd5b845b818110156115f55780358352602092830192016115dd565b509195945050505050565b6000602080838503121561161357600080fd5b823567ffffffffffffffff8082111561162b57600080fd5b818501915085601f83011261163f57600080fd5b8135818111156116515761165161153b565b8060051b9150611662848301611551565b818152918301840191848101908884111561167c57600080fd5b938501935b8385101561169a57843582529385019390850190611681565b98975050505050505050565b600080604083850312156116b957600080fd5b50508035926020909101359150565b6000604082840312156116da57600080fd5b82601f8301126116e957600080fd5b6040516040810181811067ffffffffffffffff8211171561170c5761170c61153b565b80604052508060408401858111156115db57600080fd5b600060a0828403121561173557600080fd5b82601f83011261174457600080fd5b60405160a0810181811067ffffffffffffffff821117156117675761176761153b565b6040528060a08401858111156115db57600080fd5b60006060828403121561178e57600080fd5b82601f83011261179d57600080fd5b6040516060810181811067ffffffffffffffff821117156117c0576117c061153b565b6040528060608401858111156115db57600080fd5b6000602082840312156117e757600080fd5b81356001600160a01b03811681146117fe57600080fd5b9392505050565b634e487b7160e01b600052601160045260246000fd5b600181815b8085111561185657816000190482111561183c5761183c611805565b8085161561184957918102915b93841c9390800290611820565b509250929050565b60008261186d5750600161079e565b8161187a5750600061079e565b8160018114611890576002811461189a576118b6565b600191505061079e565b60ff8411156118ab576118ab611805565b50506001821b61079e565b5060208310610133831016604e8410600b84101617156118d9575081810a61079e565b6118e3838361181b565b80600019048211156118f7576118f7611805565b029392505050565b60006117fe838361185e565b634e487b7160e01b600052603260045260246000fd5b8082018082111561079e5761079e611805565b60008261195157634e487b7160e01b600052601260045260246000fd5b500690565b60006001820161196857611968611805565b5060010190565b60808101818360005b6004811015611997578151835260209283019290910190600101611978565b50505092915050565b6000602082840312156119b257600080fd5b5051919050565b815160009082906020808601845b838110156119e3578151855293820193908201906001016119c7565b50929695505050505050565b6000825160005b81811015611a1057602081860181015185830152016119f6565b506000920191825250919050565b60408101818360005b6002811015611997578151835260209283019290910190600101611a27565b60a08101818360005b6005811015611997578151835260209283019290910190600101611a4f565b60608101818360005b6003811015611997578151835260209283019290910190600101611a77565b808202811582820484141761079e5761079e611805565b8181038181111561079e5761079e611805565b600060ff821660ff8103611ad657611ad6611805565b6001019291505056fea2646970667358221220ec7877d0a7f3591cd96091a682544d93d22e33e32c1790007677500f0de7e54664736f6c63430008130033";

type AccQueueQuinaryBlankSlConstructorParams =
  | [
      linkLibraryAddresses: AccQueueQuinaryBlankSlLibraryAddresses,
      signer?: Signer
    ]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AccQueueQuinaryBlankSlConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => {
  return (
    typeof xs[0] === "string" ||
    (Array.isArray as (arg: any) => arg is readonly any[])(xs[0]) ||
    "_isInterface" in xs[0]
  );
};

export class AccQueueQuinaryBlankSl__factory extends ContractFactory {
  constructor(...args: AccQueueQuinaryBlankSlConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      const [linkLibraryAddresses, signer] = args;
      super(
        _abi,
        AccQueueQuinaryBlankSl__factory.linkBytecode(linkLibraryAddresses),
        signer
      );
    }
  }

  static linkBytecode(
    linkLibraryAddresses: AccQueueQuinaryBlankSlLibraryAddresses
  ): string {
    let linkedBytecode = _bytecode;

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$e61c65d9562aef5fa6ab22c0f787cf1e30\\$__", "g"),
      linkLibraryAddresses[
        "maci-contracts/contracts/crypto/PoseidonT5.sol:PoseidonT5"
      ]
        .replace(/^0x/, "")
        .toLowerCase()
    );

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$1540826e134b1b69b7091c82576ee3aadd\\$__", "g"),
      linkLibraryAddresses[
        "maci-contracts/contracts/crypto/PoseidonT3.sol:PoseidonT3"
      ]
        .replace(/^0x/, "")
        .toLowerCase()
    );

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$46fbdf6658faf65265971bdad66851b86c\\$__", "g"),
      linkLibraryAddresses[
        "maci-contracts/contracts/crypto/PoseidonT6.sol:PoseidonT6"
      ]
        .replace(/^0x/, "")
        .toLowerCase()
    );

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$fa059fb1da6d850ca47ea49359bfe89f78\\$__", "g"),
      linkLibraryAddresses[
        "maci-contracts/contracts/crypto/PoseidonT4.sol:PoseidonT4"
      ]
        .replace(/^0x/, "")
        .toLowerCase()
    );

    return linkedBytecode;
  }

  override getDeployTransaction(
    _subDepth: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_subDepth, overrides || {});
  }
  override deploy(
    _subDepth: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_subDepth, overrides || {}) as Promise<
      AccQueueQuinaryBlankSl & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): AccQueueQuinaryBlankSl__factory {
    return super.connect(runner) as AccQueueQuinaryBlankSl__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AccQueueQuinaryBlankSlInterface {
    return new Interface(_abi) as AccQueueQuinaryBlankSlInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AccQueueQuinaryBlankSl {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as AccQueueQuinaryBlankSl;
  }
}

export interface AccQueueQuinaryBlankSlLibraryAddresses {
  ["maci-contracts/contracts/crypto/PoseidonT5.sol:PoseidonT5"]: string;
  ["maci-contracts/contracts/crypto/PoseidonT3.sol:PoseidonT3"]: string;
  ["maci-contracts/contracts/crypto/PoseidonT6.sol:PoseidonT6"]: string;
  ["maci-contracts/contracts/crypto/PoseidonT4.sol:PoseidonT4"]: string;
}
