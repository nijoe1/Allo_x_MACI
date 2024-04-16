import {
    IVerifyingKeyStruct,
    MessageProcessorFactory,
    PollFactory,
    TallyFactory,
    VkRegistry,
    deployPoseidonContracts,
    deployTopupCredit,
    deployVkRegistry,
    linkPoseidonLibraries,
    deployContractWithLinkedLibraries,
    deployMockVerifier,
    MockVerifier,
} from "maci-contracts"
import { MaxValues, TreeDepths } from "maci-core"
import { G1Point, G2Point } from "maci-crypto"
import { VerifyingKey } from "maci-domainobjs"
import { ethers } from "hardhat"
import { ERC20, QVMaciStrategy, MACIFactory } from "../typechain-types"
import { EthereumProvider } from "hardhat/types"

export const duration = 20

export const STATE_TREE_DEPTH = 6
export const STATE_TREE_ARITY = 5
export const MESSAGE_TREE_DEPTH = 8
export const MESSAGE_TREE_SUBDEPTH = 2
export const messageBatchSize = STATE_TREE_ARITY ** MESSAGE_TREE_SUBDEPTH

export const testProcessVk = new VerifyingKey(
    new G1Point(BigInt(0), BigInt(1)),
    new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
    new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
    new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
    [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))],
)

export const testTallyVk = new VerifyingKey(
    new G1Point(BigInt(0), BigInt(1)),
    new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
    new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
    new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
    [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))],
)

export const initialVoiceCreditBalance = 100
export const maxValues: MaxValues = {
    maxMessages: STATE_TREE_ARITY ** MESSAGE_TREE_DEPTH,
    maxVoteOptions: 125,
}

export const treeDepths: TreeDepths = {
    intStateTreeDepth: 1,
    messageTreeSubDepth: MESSAGE_TREE_SUBDEPTH,
    messageTreeDepth: MESSAGE_TREE_DEPTH,
    voteOptionTreeDepth: 3,
}

export const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth

export interface ITestContracts {
    MACIFactory: MACIFactory
    QVMaciStrategy: QVMaciStrategy
    vkRegistryContract: VkRegistry
    verifierContract: MockVerifier
}

export const deployTestContracts = async (): Promise<ITestContracts> => {
    const verifierContract = await deployMockVerifier(undefined, true)
    const vkRegistryContract = await deployVkRegistry(undefined, true)

    const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
        await deployPoseidonContracts(undefined, undefined, true)

    const poseidonAddrs = await Promise.all([
        PoseidonT3Contract.getAddress(),
        PoseidonT4Contract.getAddress(),
        PoseidonT5Contract.getAddress(),
        PoseidonT6Contract.getAddress(),
    ]).then(([poseidonT3, poseidonT4, poseidonT5, poseidonT6]) => ({
        poseidonT3,
        poseidonT4,
        poseidonT5,
        poseidonT6,
    }))

    console.log(poseidonAddrs)

    const contractsToLink = ["MACIFactory", "PollFactory", "MessageProcessorFactory", "TallyFactory"]

    // Link Poseidon contracts to MACI
    const linkedContractFactories = await Promise.all(
        contractsToLink.map(async (contractName: string) =>
            linkPoseidonLibraries(
                contractName,
                poseidonAddrs.poseidonT3,
                poseidonAddrs.poseidonT4,
                poseidonAddrs.poseidonT5,
                poseidonAddrs.poseidonT6,
                undefined,
                true,
            ),
        ),
    )

    const AlloRegistry = "0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3"
    const Allo = "0x1133eA7Af70876e64665ecD07C0A0476d09465a1"
    const DAI = await ethers.getContractFactory("dai")
    const DAI_INSTANCE = DAI.attach("0x8d573a4EBe0AC93d9cBCF1A3046C91DbF2ADD45A")

    const [MACIFactoryFactory, pollFactoryContractFactory, messageProcessorFactory, tallyFactory] =
        await Promise.all(linkedContractFactories)

    const pollFactoryContract = await deployContractWithLinkedLibraries<PollFactory>(
        pollFactoryContractFactory,
        "",
        true,
    )

    const messageProcessorFactoryContract = await deployContractWithLinkedLibraries<MessageProcessorFactory>(
        messageProcessorFactory,
        "",
        true,
    )

    const tallyFactoryContract = await deployContractWithLinkedLibraries<TallyFactory>(tallyFactory, "", true)

    const [pollAddr, mpAddr, tallyAddr] = await Promise.all([
        pollFactoryContract.getAddress(),
        messageProcessorFactoryContract.getAddress(),
        tallyFactoryContract.getAddress(),
    ])

    const MACIFactory = await deployContractWithLinkedLibraries<MACIFactory>(
        MACIFactoryFactory,
        "MACIFactory",
        true,
        vkRegistryContract,
        {
            pollFactory: pollAddr,
            tallyFactory: tallyAddr,
            subsidyFactory: tallyAddr,
            messageProcessorFactory: mpAddr,
        },
        verifierContract,
    )

    const MACIFactoryAddress = await MACIFactory.getAddress()

    console.log("MACIFactory deployed at : ", MACIFactoryAddress)

    const QVMaciRegistryFactory = await ethers.getContractFactory("QVMaciRegistry")
    const QVMaciRegistry = await QVMaciRegistryFactory.deploy(AlloRegistry, Allo, MACIFactoryAddress)

    const QVMaciRegistryAddress = await QVMaciRegistry.getAddress()

    console.log("QVMACIRegistry deployed at : ", QVMaciRegistryAddress)

    // set the verification keys on the vk smart contract
    await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
    )

    // const __MACIFactory = await ethers.getContractFactory("MACIFactory")

    // const _MACIFactory = __MACIFactory.attach(MACIFactoryAddress)

    const setMacyParams = await MACIFactory.setMaciParameters(STATE_TREE_DEPTH, treeDepths)
    await setMacyParams.wait()

    console.log("MACIFactory setMaciParameters done")

    const QVMaciStrategyFactory = await ethers.getContractFactory("QVMaciStrategy")
    const QVMaciStrategy = await QVMaciStrategyFactory.deploy(Allo, "QVMaciStrategy 2")

    const QVMaciStrategyAddress = await QVMaciStrategy.getAddress()

    // const getMaciFactory = await QVMaciStrategy._maciFactory()

    // console.log("MACIFactory deployed at : ", getMaciFactory)

    console.log("QVMaciStrategy deployed at : ", QVMaciStrategyAddress)

    // const QVMaciStrategy = await deployContractWithLinkedLibraries<MACIFactory>(
    //     MACIFactoryFactory,
    //     "QVMaciStrategy",
    //     true,
    //     QVMaciRegistryAddress,
    //     Allo,
    //     "QVMaciStrategy 1",
    //     pollAddr,
    //     mpAddr,
    //     tallyAddr,
    //     QVMaciRegistryAddress,
    //     STATE_TREE_DEPTH,
    //     treeDepths,
    //     verifierContract,
    //     vkRegistryContract,
    // )

    // console.log("QVMaciStrategy deployed at : ", await QVMaciStrategy.getAddress())

    return {
        MACIFactory,
        QVMaciStrategy,
        vkRegistryContract,
        verifierContract,
    }
}

/**
 * Travel in time in a local blockchain node
 * @param provider the provider to use
 * @param seconds the number of seconds to travel for
 */
export async function timeTravel(provider: EthereumProvider, seconds: number): Promise<void> {
    await provider.send("evm_increaseTime", [Number(seconds)])
    await provider.send("evm_mine", [])
}
