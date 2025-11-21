const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying BlueRaffle FIXED with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BNB");

  // Contract parameters - UPDATED WITH CORRECT SUBSCRIPTION ID
  const BLUE_TOKEN = process.env.MOCK_BLUE_TOKEN || "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const TREASURY = process.env.TREASURY_WALLET || deployer.address;
  const DEVELOPER = process.env.DEVELOPER_WALLET || deployer.address;
  const VRF_COORDINATOR = "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f"; // BNB Testnet VRF Coordinator
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "43371163114061566586232043748699703279439038188185138377217877577027786652944";
  const KEY_HASH = process.env.VRF_KEY_HASH || "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314";

  console.log("\n📋 Deployment Parameters:");
  console.log("BLUE Token:", BLUE_TOKEN);
  console.log("Treasury:", TREASURY);
  console.log("Developer:", DEVELOPER);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("VRF Subscription ID:", SUBSCRIPTION_ID);
  console.log("Key Hash:", KEY_HASH);

  // Validation
  if (!BLUE_TOKEN || BLUE_TOKEN === "undefined") {
    console.error("❌ BLUE_TOKEN not set in .env file!");
    process.exit(1);
  }

  try {
    console.log("\n🔨 Deploying BlueRaffle FIXED contract...");
    const BlueRaffle = await hre.ethers.getContractFactory("BlueRaffle");

    console.log("📝 Sending deployment transaction...");
    const raffle = await BlueRaffle.deploy(
      BLUE_TOKEN,
      TREASURY,
      DEVELOPER,
      VRF_COORDINATOR,
      SUBSCRIPTION_ID,
      KEY_HASH
    );

    console.log("⏳ Deployment transaction sent, hash:", raffle.deploymentTransaction().hash);
    console.log("⏳ Waiting for confirmation...");

    await raffle.waitForDeployment();
    const raffleAddress = await raffle.getAddress();

    console.log("\n✅ BlueRaffle FIXED deployed to:", raffleAddress);

    // Test basic functions
    console.log("\n🧪 Testing contract functions...");
    const isPaused = await raffle.paused();
    const currentRoundId = await raffle.currentRoundId();
    const minParticipants = await raffle.minParticipants();

    console.log("Contract Paused:", isPaused);
    console.log("Current Round ID:", currentRoundId.toString());
    console.log("Min Participants:", minParticipants.toString());

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      contractAddress: raffleAddress,
      blueToken: BLUE_TOKEN,
      treasury: TREASURY,
      developer: DEVELOPER,
      vrfCoordinator: VRF_COORDINATOR,
      subscriptionId: SUBSCRIPTION_ID,
      keyHash: KEY_HASH,
      deployer: deployer.address,
      deploymentTxHash: raffle.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      version: "1.1-FIXED"
    };

    const filename = `deployment-fixed-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n💾 Deployment info saved to:", filename);

    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("1. Add this contract as a consumer to your VRF subscription:");
    console.log("   Go to: https://vrf.chain.link/bnb-chain-testnet");
    console.log("   Subscription ID:", SUBSCRIPTION_ID);
    console.log("   Click 'Add Consumer' and add:", raffleAddress);
    console.log("\n2. Update your frontend config.js with new address:");
    console.log("   CONTRACT_ADDRESS =", raffleAddress);
    console.log("\n3. Verify contract on BSCScan (optional):");
    console.log("   Run: npm run verify");

    // Optional: Auto-verify after 30 seconds
    if (process.env.AUTO_VERIFY === "true") {
      console.log("\n🔍 Waiting 30 seconds before verification...");
      await new Promise(resolve => setTimeout(resolve, 30000));

      try {
        console.log("Verifying contract on BSCScan...");
        await hre.run("verify:verify", {
          address: raffleAddress,
          constructorArguments: [
            BLUE_TOKEN,
            TREASURY,
            DEVELOPER,
            VRF_COORDINATOR,
            SUBSCRIPTION_ID,
            KEY_HASH
          ]
        });
        console.log("✅ Contract verified on BSCScan!");
      } catch (error) {
        console.log("⚠️  Verification failed:", error.message);
        console.log("\nYou can verify manually later with:");
        console.log(`npx hardhat verify --network bsc_testnet ${raffleAddress} "${BLUE_TOKEN}" "${TREASURY}" "${DEVELOPER}" "${VRF_COORDINATOR}" "${SUBSCRIPTION_ID}" "${KEY_HASH}"`);
      }
    }

    console.log("\n🎉 Deployment complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
