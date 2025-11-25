const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(60));
  console.log("Blue Dice - Deployment Script");
  console.log("=".repeat(60));

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");

  // Configuration
  const BLUE_TOKEN = process.env.BLUE_TOKEN || "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const TREASURY_WALLET = process.env.TREASURY_WALLET || "0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2";

  console.log("\n--- Configuration ---");
  console.log("BLUE Token:", BLUE_TOKEN);
  console.log("Treasury Wallet:", TREASURY_WALLET);
  console.log("Network:", hre.network.name);

  // Deploy BlueDice
  console.log("\n--- Deploying BlueDice ---");
  const BlueDice = await hre.ethers.getContractFactory("BlueDice");
  const blueDice = await BlueDice.deploy(BLUE_TOKEN, TREASURY_WALLET);

  await blueDice.waitForDeployment();
  const contractAddress = await blueDice.getAddress();

  console.log("BlueDice deployed to:", contractAddress);

  // Wait for confirmations
  console.log("\nWaiting for confirmations...");
  await blueDice.deploymentTransaction().wait(3);
  console.log("Confirmed!");

  // Get initial contract state
  console.log("\n--- Initial Contract State ---");
  const minBet = await blueDice.minBet();
  const maxBet = await blueDice.maxBet();
  const maxPayout = await blueDice.maxPayout();
  const houseEdge = await blueDice.houseEdge();
  const houseBankroll = await blueDice.houseBankroll();

  console.log("Min Bet:", hre.ethers.formatEther(minBet), "BLUE");
  console.log("Max Bet:", hre.ethers.formatEther(maxBet), "BLUE");
  console.log("Max Payout:", hre.ethers.formatEther(maxPayout), "BLUE");
  console.log("House Edge:", Number(houseEdge) / 100, "%");
  console.log("House Bankroll:", hre.ethers.formatEther(houseBankroll), "BLUE");

  // Export ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BlueDice.sol/BlueDice.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiPath = path.join(__dirname, "../frontend/src/config/abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("\nABI exported to:", abiPath);

  // Export contract config
  const configPath = path.join(__dirname, "../frontend/src/config/contract.json");
  const config = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    explorerUrl: "https://testnet.bscscan.com",
    blueToken: BLUE_TOKEN,
    treasuryWallet: TREASURY_WALLET,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Config exported to:", configPath);

  // Verification command
  console.log("\n--- Verification ---");
  console.log("To verify on BSCScan, run:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${BLUE_TOKEN}" "${TREASURY_WALLET}"`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Explorer:", `https://testnet.bscscan.com/address/${contractAddress}`);
  console.log("\nIMPORTANT: Fund the house bankroll before accepting bets!");
  console.log("Call fundHouse() with BLUE tokens to enable payouts.");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
