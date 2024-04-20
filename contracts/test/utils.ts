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
import { ethers, upgrades } from "hardhat"
import {
    ERC20,
    QVMACI,
    ClonableMACI,
    ClonableAccQueueQuinaryBlankSl,
    ClonableAccQueueQuinaryMaci,
    ClonablePoll,
    ClonableMessageProcessor,
    ClonableTally,
} from "../typechain-types"
import { EthereumProvider } from "hardhat/types"
import { create } from "domain"
import dotenv from "dotenv"
import { libraries } from "../typechain-types/contracts/core"
dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY

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
    QVMaciStrategy: QVMACI
    vkRegistryContract: VkRegistry
    verifierContract: MockVerifier
}

export const deployTestContracts = async (): Promise<ITestContracts> => {
    const verifierContract = await deployMockVerifier(undefined, true)
    const vkRegistryContract = await deployVkRegistry(undefined, true)

    const verifierContractAddress = await verifierContract.getAddress()
    const vkRegistryContractAddress = await vkRegistryContract.getAddress()

    console.log("Verifier deployed at : ", verifierContractAddress)
    console.log("VkRegistry deployed at : ", vkRegistryContractAddress)

    // const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    //     await deployPoseidonContracts(undefined, undefined, true)

    // const poseidonAddrs = await Promise.all([
    //     PoseidonT3Contract.getAddress(),
    //     PoseidonT4Contract.getAddress(),
    //     PoseidonT5Contract.getAddress(),
    //     PoseidonT6Contract.getAddress(),
    // ]).then(([poseidonT3, poseidonT4, poseidonT5, poseidonT6]) => ({
    //     poseidonT3,
    //     poseidonT4,
    //     poseidonT5,
    //     poseidonT6,
    // }))

    const poseidonAddrs = {
        poseidonT3: "0x04f061257fCbBC83761Fb08bb8b4097f6e7d08db",
        poseidonT4: "0x7E09e01ECf81d40d855a9e4C4e74CB84ab7173d9",
        poseidonT5: "0xDb59ba01588227aD9013478E1B5D5fBb3505dE0e",
        poseidonT6: "0x233C59079C51caA207E79CD42e40f83fd2FC6455",
    }

    console.log(poseidonAddrs)

    const contractsToLink = [
        "ClonablePoll",
        "ClonableMessageProcessor",
        "ClonableTally",
        "ClonableMACI",
        "ClonableAccQueueQuinaryBlankSl",
        "ClonableAccQueueQuinaryMaci",
        "PollFactory",
        "MessageProcessorFactory",
        "TallyFactory",
    ]

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

    const [
        ClonablePollFactory,
        ClonableMessageProcessorFactory,
        ClonableTallyFactory,
        ClonableMACIFactory,
        ClonableAccQueueQuinaryBlankSlFactory,
        ClonableAccQueueQuinaryMaciFactory,
        // pollFactoryContractFactory,
        // messageProcessorFactory,
        // tallyFactory,
    ] = await Promise.all(linkedContractFactories)

    const pollFactoryContract = await deployContractWithLinkedLibraries<ClonablePoll>(ClonablePollFactory, "", true)

    const messageProcessorFactoryContract = await deployContractWithLinkedLibraries<ClonableMessageProcessor>(
        ClonableMessageProcessorFactory,
        "",
        true,
    )

    const tallyFactoryContract = await deployContractWithLinkedLibraries<ClonableTally>(ClonableTallyFactory, "", true)

    const ClonableAccQueueQuinaryBlankSl = await deployContractWithLinkedLibraries<ClonableAccQueueQuinaryBlankSl>(
        ClonableAccQueueQuinaryBlankSlFactory,
        "ClonableAccQueueQuinaryBlankSl",
        true,
    )

    const ClonableAccQueueQuinaryBlankSlAddress = await ClonableAccQueueQuinaryBlankSl.getAddress()

    console.log("ClonableAccQueueQuinaryBlankSlAddress deployed at : ", ClonableAccQueueQuinaryBlankSlAddress)

    const ClonableAccQueueQuinaryMaci = await deployContractWithLinkedLibraries<ClonableAccQueueQuinaryMaci>(
        ClonableAccQueueQuinaryMaciFactory,
        "ClonableAccQueueQuinaryMaci",
        true,
    )

    const ClonableAccQueueQuinaryMaciAddress = await ClonableAccQueueQuinaryMaci.getAddress()

    console.log("ClonableAccQueueQuinaryMaciAddress deployed at : ", ClonableAccQueueQuinaryMaciAddress)

    const [pollAddr, mpAddr, tallyAddr] = await Promise.all([
        pollFactoryContract.getAddress(),
        messageProcessorFactoryContract.getAddress(),
        tallyFactoryContract.getAddress(),
    ])

    // const pollAddr = "0xF8F779dc7089f181E5D9d351CB31ad1433F95320"
    // const mpAddr = "0xE9502C439390d1f587f0ddAdac9643F5BB534a02"
    // const tallyAddr = "0x5ba3DDe546FDA7953689a5801a92eFc81C804372"

    console.log("PollFactory deployed at : ", pollAddr)
    console.log("MessageProcessorFactory deployed at : ", mpAddr)
    console.log("TallyFactory deployed at : ", tallyAddr)

    // --------------------------------------------------  Clonable MACI  --------------------------------------------------

    const ClonableMACI = await deployContractWithLinkedLibraries<ClonableMACI>(
        ClonableMACIFactory,
        "ClonableMACI",
        true
    )

    const ClonableMACIAddress = await ClonableMACI.getAddress()

    console.log("ClonableMACIAddress deployed at : ", ClonableMACIAddress)


    const _ClonableMACIFactory = await ethers.getContractFactory("ClonableMACIFactory")

    const __ClonableMACIFactory = await upgrades.deployProxy(_ClonableMACIFactory, [
        STATE_TREE_DEPTH,
        treeDepths,
        verifierContractAddress,
        vkRegistryContractAddress,
        ClonableMACIAddress,
        ClonableAccQueueQuinaryBlankSlAddress,
        ClonableAccQueueQuinaryMaciAddress,
        pollAddr,
        tallyAddr,
        mpAddr,
    ])

    const ClonableMACIFactoryAddress = await __ClonableMACIFactory.getAddress()

    console.log("ClonableMACIFactoryAddress deployed at : ", ClonableMACIFactoryAddress)

    // const setClonableMACIAddress = await __ClonableMACIFactory.setClonableMaciImplementation(ClonableMACIAddress)

    // const setClonableMACIAddressReceipt = await setClonableMACIAddress.wait()

    // console.log("ClonableMaciImplementation set Successfully")

    await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
    )

    const QVMaciStrategyFactory = await ethers.getContractFactory("QVMACI")

    const QVMaciStrategy = await QVMaciStrategyFactory.deploy(Allo, "QVMACI", ClonableMACIFactoryAddress)

    const QVMaciStrategyAddress = await QVMaciStrategy.getAddress()

    console.log("QVMaciStrategy deployed at : ", QVMaciStrategyAddress)

    const createStrategyFactory = await ethers.getContractFactory("CreateStrategy")

    const createStrategy = await createStrategyFactory.deploy(
        Allo,
        AlloRegistry,
        QVMaciStrategyAddress,
        ClonableMACIFactoryAddress,
    )

    const createStrategyAddress = await createStrategy.getAddress()

    console.log("CreateStrategy deployed at : ", createStrategyAddress)

    const time = await createStrategy.getTime()

    console.log("Time : ", time)

    const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

    console.log("Signer : ", signer.address)
    let initializeParams = {
        registryGating: true,
        metadataRequired: true,
        reviewThreshold: BigInt(1),
        registrationStartTime: BigInt(time + BigInt(100)),
        registrationEndTime: BigInt(time + BigInt(200)),
        allocationStartTime: BigInt(time + BigInt(200)),
        allocationEndTime: BigInt(time + BigInt(500)),
        maxVoiceCreditsPerAllocator: BigInt(100),
    }

    try {
        const createPool = await createStrategy.createQVMaciPool(
            initializeParams,
            // coordinator:
            signer.address,
            // coordinatorPubKey:
            {
                x: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
                y: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
            },
        )
        const poolAddress = await createPool.wait()
        console.log("Pool Address : ", poolAddress)
    } catch (error) {
        console.log("Error : ", error)
    }

    const poolAddress = await createStrategy.strategies(0)

    console.log("Pool Address : ", poolAddress)

    const poolMaciInfo = await createStrategy.strategyToMaciParams(poolAddress)

    console.log("Pool Maci Info : ", poolMaciInfo)

    const QVMACI_instance = QVMaciStrategyFactory.attach(poolAddress)

    const maci = await QVMACI_instance._maci()

    console.log("MACI deployed at : ", maci)

    const macifac = await QVMACI_instance.maciFactory()

    console.log("maciFactory defined in : ", macifac)

    const ClonableMACI_instance = await ethers.getContractAt("ClonableMACI", maci)

    const vkReg = await ClonableMACI_instance.vkRegistry()

    console.log("VkRegistry defined in : ", vkReg)


    return {
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
