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
import { Signer } from "ethers"
import {
    ERC20,
    Allo,
    Registry,
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
const PRIVATE_KEY_USER1 = process.env.PRIVATE_KEY_USER1
const PRIVATE_KEY_USER2 = process.env.PRIVATE_KEY_USER2
const PRIVATE_KEY_USER3 = process.env.PRIVATE_KEY_USER3

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
    Allo: Allo
    QVMACI_STRATEGY: QVMACI
    vkRegistryContract: VkRegistry
    verifierContract: MockVerifier
    maciContract: ClonableMACI
    pollContract: ClonablePoll
    messageProcessorContract: ClonableMessageProcessor
    tallyContract: ClonableTally
    user1: Signer
    user2: Signer
    user3: Signer
}

export const deployAlloContracts = async () => {
    const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider)
    console.log("Signer : ", signer.address)

    const RegistryFactory = await ethers.getContractFactory("Registry")
    // address _owner
    const Registry = await upgrades.deployProxy(RegistryFactory, [signer.address])
    const registryAddress = await Registry.getAddress()
    console.log("Registry deployed at : ", registryAddress)

    const AlloFactory = await ethers.getContractFactory("Allo")
    // address _owner,
    // address _registry,
    // address payable _treasury,
    // uint256 _percentFee,
    // uint256 _baseFee
    const Allo = await upgrades.deployProxy(AlloFactory, [signer.address, registryAddress, signer.address, 0, 0])
    const alloAddress = await Allo.getAddress()

    const DaiFactory = await ethers.getContractFactory("dai")
    const Dai = await DaiFactory.deploy()

    const daiAddress = await Dai.getAddress()

    console.log("Dai deployed at : ", daiAddress)

    return {
        AlloAddress: alloAddress,
        RegistryAddress: registryAddress,
        DaiAddress: daiAddress,
        Allo: Allo as Allo,
        Registry: Registry as Registry,
    }
}

export const deployTestContracts = async (): Promise<ITestContracts> => {
    const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

    console.log("Signer : ", signer.address)

    const AlloContracts = await deployAlloContracts()

    const verifierContract = await deployMockVerifier(undefined, true)
    const vkRegistryContract = await deployVkRegistry(undefined, true)

    const verifierContractAddress = await verifierContract.getAddress()
    const vkRegistryContractAddress = await vkRegistryContract.getAddress()

    console.log("Verifier deployed at : ", verifierContractAddress)
    console.log("VkRegistry deployed at : ", vkRegistryContractAddress)

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

    const contractsToLink = [
        "ClonablePoll",
        "ClonableMessageProcessor",
        "ClonableTally",
        "ClonableMACI",
        "ClonableAccQueueQuinaryBlankSl",
        "ClonableAccQueueQuinaryMaci",
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

    const AlloRegistry = AlloContracts.RegistryAddress
    const Allo = AlloContracts.AlloAddress
    const DAI = await ethers.getContractFactory("dai")
    const DAI_INSTANCE = DAI.attach(AlloContracts.DaiAddress)

    const [
        ClonablePollFactory,
        ClonableMessageProcessorFactory,
        ClonableTallyFactory,
        ClonableMACIFactory,
        ClonableAccQueueQuinaryBlankSlFactory,
        ClonableAccQueueQuinaryMaciFactory,
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

    console.log("PollFactory deployed at : ", pollAddr)
    console.log("MessageProcessorFactory deployed at : ", mpAddr)
    console.log("TallyFactory deployed at : ", tallyAddr)

    // --------------------------------------------------  Clonable MACI  --------------------------------------------------

    const ClonableMACI = await deployContractWithLinkedLibraries<ClonableMACI>(
        ClonableMACIFactory,
        "ClonableMACI",
        true,
    )

    const ClonableMACIAddress = await ClonableMACI.getAddress()

    console.log("ClonableMACIAddress deployed at : ", ClonableMACIAddress)

    // --------------------------------------------------  Clonable MACI Factory  --------------------------------------------------

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

    // --------------------------------------------------  Add ClonableMACI to Allo allowed strategies  ----------------------------

    const addStrategy = await AlloContracts.Allo.addToCloneableStrategies(QVMaciStrategyAddress)

    const addStrategyReceipt = await addStrategy.wait()

    console.log("Strategy added to Allo allowed strategies")

    // uint256 _nonce,
    // string memory _name,
    // Metadata memory _metadata,
    // address _owner,
    // address[] memory _members
    const createProfile = await AlloContracts.Registry.createProfile(
        0,
        "Test",
        {
            protocol: 1,
            pointer: "test",
        },
        signer.address,
        [signer.address],
    )

    const createProfileReceipt = await createProfile.wait()

    // Get from the receipt of the create profile transaction the logs from the createProfile event and console log it
    // THe event => emit ProfileCreated(profileId, profile.nonce, profile.name, profile.metadata, profile.owner, profile.anchor);

    const profileId = createProfileReceipt?.logs[0].topics[1] || ""

    console.log("Profile Id : ", profileId)

    // --------------------------------------------------  Create Strategy  --------------------------------------------------

    const time = BigInt((await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))!.timestamp)

    console.log("Time : ", time)

    let initializeParams = [
        false,
        true,
        BigInt(1),
        BigInt(time + BigInt(1)),
        BigInt(time + BigInt(200)),
        BigInt(time + BigInt(200)),
        BigInt(time + BigInt(500)),
        BigInt(100),
    ]

    let MaciParams = [
        // coordinator:
        signer.address,
        // coordinatorPubKey:
        [
            BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
            BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
        ],
        ClonableMACIFactoryAddress,
    ]

    let initStruct = [initializeParams, MaciParams]

    let types = ["((bool,bool,uint256,uint256,uint256,uint256,uint256,uint256),(address,(uint256,uint256),address))"]

    let AbiCoder = new ethers.AbiCoder()

    let bytes = AbiCoder.encode(types, [initStruct])
    // console.log("Bytes : ", bytes)
    // bytes32 _profileId,
    // address _strategy,
    // bytes memory _initStrategyData,
    // address _token,
    // uint256 _amount,
    // Metadata memory _metadata,
    // address[] memory _managers
    const createPool = await AlloContracts.Allo.createPool(
        profileId,
        QVMaciStrategyAddress,
        bytes,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        0,
        {
            protocol: 1,
            pointer: "test",
        },
        [signer.address],
    )
    // Get the receipt of the create pool transaction the _strategy and console log it
    // emit PoolCreated(poolId, _profileId, _strategy, _token, _amount, _metadata);
    const createPoolReceipt = await createPool.wait()

    const poolAddress = await (await AlloContracts.Allo.getPool(1)).strategy

    console.log("Pool Address : ", poolAddress)

    const QVMACI_instance = QVMaciStrategyFactory.attach(poolAddress)

    const QVMACI_STRATEGY = await ethers.getContractAt("QVMACI", poolAddress)

    const maci = await QVMACI_instance._maci()

    console.log("MACI deployed at : ", maci)

    const pollContracts = await QVMACI_instance._pollContracts()

    console.log("_pollContracts: ", pollContracts)

    let maciContract2 = (await ethers.getContractAt("ClonableMACI", maci)) as ClonableMACI

    console.log("MACI deployed at : ", await maciContract2.stateTreeDepth())

    const signer2 = new ethers.Wallet(PRIVATE_KEY_USER1, ethers.provider) as Signer
    const signer3 = new ethers.Wallet(PRIVATE_KEY_USER2, ethers.provider) as Signer
    const signer4 = new ethers.Wallet(PRIVATE_KEY_USER3, ethers.provider) as Signer

    return {
        Allo: AlloContracts.Allo,
        QVMACI_STRATEGY,
        vkRegistryContract,
        verifierContract,
        maciContract: (await ethers.getContractAt("ClonableMACI", maci)) as ClonableMACI,
        pollContract: (await ethers.getContractAt("ClonablePoll", pollContracts[0])) as ClonablePoll,
        messageProcessorContract: (await ethers.getContractAt(
            "ClonableMessageProcessor",
            pollContracts[1],
        )) as ClonableMessageProcessor,
        tallyContract: (await ethers.getContractAt("ClonableTally", pollContracts[2])) as ClonableTally,
        user1: signer2,
        user2: signer3,
        user3: signer4,
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
