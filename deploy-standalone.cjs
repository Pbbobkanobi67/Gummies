const hre = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying BlueRaffle_Standalone...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "BNB\n");

    // VRF v2.5 Settings for BNB Testnet
    const BLUE_TOKEN = "0x8cd0d76C0ad377378aB6Ce878E7f11F2E5c6a2E8";
    const VRF_COORDINATOR = "0xDA3b641D438362C440Ac5458c57e00a712b66700"; // VRF v2.5
    const SUBSCRIPTION_ID = "26655927599451290729520880429262733726305991805472180956508373717196718435172"; // uint256
    const KEY_HASH = "0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26"; // v2.5 key hash
    const TREASURY_WALLET = "0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2";
    const DEVELOPER_WALLET = "0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2";

    console.log("Configuration:");
    console.log("  BLUE Token:", BLUE_TOKEN);
    console.log("  VRF Coordinator:", VRF_COORDINATOR, "(v2.5)");
    console.log("  Subscription ID:", SUBSCRIPTION_ID);
    console.log("  Key Hash:", KEY_HASH);
    console.log("  Treasury:", TREASURY_WALLET);
    console.log("  Developer:", DEVELOPER_WALLET);
    console.log();

    const BlueRaffle = await hre.ethers.getContractFactory("BlueRaffle");

    console.log("⏳ Deploying contract...");
    const blueRaffle = await BlueRaffle.deploy(
        BLUE_TOKEN,
        VRF_COORDINATOR,
        SUBSCRIPTION_ID,
        KEY_HASH,
        TREASURY_WALLET,
        DEVELOPER_WALLET
    );

    await blueRaffle.waitForDeployment();

    const contractAddress = await blueRaffle.getAddress();
    console.log("\n✅ BlueRaffle_Standalone deployed to:", contractAddress);

    console.log("\n📝 NEXT STEPS:");
    console.log("1. Add this contract as a consumer to VRF subscription:");
    console.log("   https://vrf.chain.link/bnb-chain-testnet/" + SUBSCRIPTION_ID);
    console.log("\n2. Verify contract on BSCScan:");
    console.log("   npx hardhat verify --network bsc_testnet", contractAddress, BLUE_TOKEN, VRF_COORDINATOR, SUBSCRIPTION_ID, KEY_HASH, TREASURY_WALLET, DEVELOPER_WALLET);
    console.log("\n3. Update frontend config.js with new contract address:", contractAddress);
    console.log("\n4. Test with diagnostic tool");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
