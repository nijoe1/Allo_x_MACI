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
import { ERC20, QVMACI, ClonableMACI } from "../typechain-types"
import { EthereumProvider } from "hardhat/types"
import { create } from "domain"
import dotenv from "dotenv"
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
    ClonableMACI: ClonableMACI
    QVMaciStrategy: QVMACI
    vkRegistryContract: VkRegistry
    verifierContract: MockVerifier
}

export const deployTestContracts = async (): Promise<ITestContracts> => {
    const verifierContract = await deployMockVerifier(undefined, true)
    const vkRegistryContract = await deployVkRegistry(undefined, true)

    // const verifierContractAddress = await verifierContract.getAddress()
    // const vkRegistryContractAddress = await vkRegistryContract.getAddress()

    // console.log("Verifier deployed at : ", verifierContractAddress)
    // console.log("VkRegistry deployed at : ", vkRegistryContractAddress)

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

    // const poseidonAddrs = {
    //     poseidonT3: "0x458A1CB559CD3D3E2E0285967D5eb766727290b8",
    //     poseidonT4: "0xb47b7Fc62948E833652a210a87B3E808ce3538cC",
    //     poseidonT5: "0x9A85Cd96465219A5eF82fd45d26238c5a7d30838",
    //     poseidonT6: "0x20d0cCE467d126c2c566a2d2Ce81E7a59f1dD41E",
    // }

    console.log(poseidonAddrs)

    const contractsToLink = ["ClonableMACI", "PollFactory", "MessageProcessorFactory", "TallyFactory"]

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

    const [ClonableMACIFactory, pollFactoryContractFactory, messageProcessorFactory, tallyFactory] =
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

    // const pollAddr = "0x57A2FdeFF5E02D34668955C766073115079d3B34"
    // const mpAddr = "0xc347625B365d6468284071FDc24CE9C2614b7868"
    // const tallyAddr = "0x3415fC265791Ee14A03A746832b9d5B32F887255"

    console.log("PollFactory deployed at : ", pollAddr)
    console.log("MessageProcessorFactory deployed at : ", mpAddr)
    console.log("TallyFactory deployed at : ", tallyAddr)

    await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
    )

    const ClonableMACI = await deployContractWithLinkedLibraries<ClonableMACI>(
        ClonableMACIFactory,
        "ClonableMACI",
        true,
        pollAddr,
        mpAddr,
        tallyAddr,
        tallyAddr,
        STATE_TREE_DEPTH,
        treeDepths,
        verifierContract,
        vkRegistryContract,
    )

    const ClonableMACIAddress = await ClonableMACI.getAddress()

    // const MACIFactoryAddress = "0xF529569eDF00AfAe960E958fE07B70425e1Be322"

    console.log("ClonableMACIAddress deployed at : ", ClonableMACIAddress)

    // const __MACIFactory = await ethers.getContractFactory("MACIFactory")

    // const _MACIFactory = __MACIFactory.attach(MACIFactoryAddress)

    // const setMacyParams = await MACIFactory.setMaciParameters(STATE_TREE_DEPTH, treeDepths)
    // await setMacyParams.wait()

    // console.log("MACIFactory setMaciParameters done")

    const QVMaciStrategyFactory = await ethers.getContractFactory("QVMACI")
    const QVMaciStrategy = await QVMaciStrategyFactory.deploy(Allo, "QVMACI", ClonableMACIAddress)

    const QVMaciStrategyAddress = await QVMaciStrategy.getAddress()

    console.log("QVMaciStrategy deployed at : ", QVMaciStrategyAddress)

    const createStrategyFactory = await ethers.getContractFactory("CreateStrategy")
    const createStrategy = await createStrategyFactory.deploy(Allo, AlloRegistry, QVMaciStrategyAddress)

    const createStrategyAddress = await createStrategy.getAddress()

    console.log("CreateStrategy deployed at : ", createStrategyAddress)

    const time = await createStrategy.getTime()

    console.log("Time : ", time)

    const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

    console.log("Signer : ", signer.address)

    const createPool = await createStrategy.createQVMaciPool(
        {
            params: {
                registryGating: true,
                metadataRequired: true,
                reviewThreshold: BigInt(1),
                registrationStartTime: BigInt(time + BigInt(100)),
                registrationEndTime: BigInt(time + BigInt(200)),
                allocationStartTime: BigInt(time + BigInt(200)),
                allocationEndTime: BigInt(time + BigInt(500)),
                maxVoiceCreditsPerAllocator: BigInt(100),
            },
            maciParams: {
                coordinator: signer.address,
                coordinatorPubKey: {
                    x: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
                    y: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
                },
                _maciFactory: ClonableMACIAddress,
            },
        },
        { gasLimit: 10000000 },
    )
    try {
        const poolAddress = await createPool.wait()
        console.log("Pool Address : ", poolAddress)
    } catch (error) {
        console.log("Error : ", error)
    }

    // const getMaciFactory = await QVMaciStrategy._maciFactory()

    // console.log("MACIFactory deployed at : ", getMaciFactory)

    return {
        ClonableMACI,
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
