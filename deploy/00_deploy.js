require("hardhat-deploy")
require("hardhat-deploy-ethers")

const { ethers } = require("hardhat")
const { Console } = require("console")

const private_key = network.config.accounts[0]
const wallet = new ethers.Wallet(private_key, ethers.provider)

const TREE_ARITY = 5

module.exports = async ({ deployments }) => {
    const { deploy } = deployments

    console.log("Wallet+ Ethereum Address:", wallet.address)

    const AlloRegistry = "0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3"
    const Allo = "0x1133eA7Af70876e64665ecD07C0A0476d09465a1"
    const DAI = await ethers.getContractFactory("dai")
    const DAI_INSTANCE = DAI.attach("0x8d573a4EBe0AC93d9cBCF1A3046C91DbF2ADD45A")
    const QVMACIStrategy = "0x17bD879c22D5465209aF98fa9Beeb327F5af6a15"

    const _QVMACIRegistry = await ethers.getContractFactory("QVMaciRegistry")

    const abi = _QVMACIRegistry.interface
    const QVMaciRegistry = new ethers.Contract("0xFD8a6164741CB6c7F1bA4efAC643a7E1cfe3443F", abi, wallet)

    console.log("QVMACIRegistry deployed at : ", QVMaciRegistry.address)

    const setQVMaciStrategy = await QVMaciRegistry.setPoolStrategyImplementation(
        "0xCed152a2174B0754D5591E495482C997E6a978a2",
    )

    await setQVMaciStrategy.wait()

    console.log("QVMaciStrategy set")

    // // -------------------------------- Create Profile --------------------------------

    const createProfile = await QVMaciRegistry.createProfile("QVMaciStrategyTest", [1, "test"], [wallet.address], {
        gasLimit: 1000000,
    })

    await createProfile.wait()

    console.log("Profile created")

    const table1 = await QVMaciRegistry.tables(0)
    const table2 = await QVMaciRegistry.tables(1)
    const table3 = await QVMaciRegistry.tables(2)
    const table4 = await QVMaciRegistry.tables(3)
    const table5 = await QVMaciRegistry.tables(4)
    const table6 = await QVMaciRegistry.tables(5)
    const table7 = await QVMaciRegistry.tables(6)
    const table8 = await QVMaciRegistry.tables(7)

    console.log(table1, "-", table2, "-", table3, "-", table4, "-", table5, "-", table6, "-", table7, "-", table8)

    const profilesTableID = await QVMaciRegistry.tableIDs(0)
    console.log(`https://tables.testnets.tableland.xyz/421614/${profilesTableID}.html`)

    const profileID = "0x743fdc14d43abf4866293b06a897dda1872b39c68e5943a080505d6b5af483e8"

    // // -------------------------------- Create MACI Strategy Pool--------------------------------

    const time = await QVMaciRegistry.getTime()

    const poolParams = {
        registryGating: false,
        metadataRequired: true,
        reviewThreshold: 1,
        registrationStartTime: time + 100,
        registrationEndTime: time + 200,
        allocationStartTime: time + 200,
        allocationEndTime: time + 500,
        maxVoiceCreditsPerAllocator: 100,
        coordinator: wallet.address,
        coordinatorPubKey: {
            x: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
            y: BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495611"),
        },
    }

    const AproveDai = await DAI_INSTANCE.approve(QVMaciRegistry.address, BigInt("100"))
    await AproveDai.wait()

    console.log("dai approved")

    const poolManagers = [wallet.address]
    const createQVMaciPool = await QVMaciRegistry.createQVMaciPool(
        profileID,
        poolParams,
        DAI_INSTANCE.address,
        100,
        {
            protocol: 1,
            pointer: "test pool metadata",
        },
        poolManagers,
        { gasLimit: 100000000 },
    )

    await createQVMaciPool.wait()
}
