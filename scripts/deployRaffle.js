const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(60));
  console.log("Blue Raffle - Deployment Script");
  console.log("=".repeat(60));

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB");

  // Configuration
  const BLUE_TOKEN = process.env.BLUE_TOKEN || "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const TREASURY_WALLET = process.env.TREASURY_WALLET || "0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2";
  const DEVELOPER_WALLET = process.env.DEVELOPER_WALLET || deployer.address;

  console.log("\n--- Configuration ---");
  console.log("BLUE Token:", BLUE_TOKEN);
  console.log("Treasury Wallet:", TREASURY_WALLET);
  console.log("Developer Wallet:", DEVELOPER_WALLET);
  console.log("Network:", hre.network.name);

  // Deploy BlueRaffleBlockhash
  console.log("\n--- Deploying BlueRaffleBlockhash ---");
  const BlueRaffle = await hre.ethers.getContractFactory("BlueRaffleBlockhash");
  const blueRaffle = await BlueRaffle.deploy(BLUE_TOKEN, TREASURY_WALLET, DEVELOPER_WALLET);

  await blueRaffle.waitForDeployment();
  const contractAddress = await blueRaffle.getAddress();

  console.log("BlueRaffleBlockhash deployed to:", contractAddress);

  // Wait for confirmations
  console.log("\nWaiting for confirmations...");
  await blueRaffle.deploymentTransaction().wait(3);
  console.log("Confirmed!");

  // Get initial contract state
  console.log("\n--- Initial Contract State ---");
  const minTickets = await blueRaffle.minTickets();
  const maxTickets = await blueRaffle.maxTickets();
  const roundDuration = await blueRaffle.roundDuration();
  const currentRoundId = await blueRaffle.currentRoundId();
  const ticketMultiplier = await blueRaffle.ticketMultiplier();

  console.log("Min Tickets:", hre.ethers.formatEther(minTickets), "BLUE");
  console.log("Max Tickets:", hre.ethers.formatEther(maxTickets), "BLUE");
  console.log("Round Duration:", Number(roundDuration) / 60, "minutes");
  console.log("Current Round:", currentRoundId.toString());
  console.log("Ticket Multiplier:", ticketMultiplier.toString(), "x");

  // Export ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BlueRaffleBlockhash.sol/BlueRaffleBlockhash.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiPath = path.join(__dirname, "../frontend/src/config/raffleAbi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("\nABI exported to:", abiPath);

  // Export contract config
  const configPath = path.join(__dirname, "../frontend/src/config/raffleContract.json");
  const config = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    explorerUrl: "https://testnet.bscscan.com",
    blueToken: BLUE_TOKEN,
    treasuryWallet: TREASURY_WALLET,
    developerWallet: DEVELOPER_WALLET,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Config exported to:", configPath);

  // Verification command
  console.log("\n--- Verification ---");
  console.log("To verify on BSCScan, run:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${BLUE_TOKEN}" "${TREASURY_WALLET}" "${DEVELOPER_WALLET}"`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Explorer:", `https://testnet.bscscan.com/address/${contractAddress}`);
  console.log("\nRaffle is ready to accept tickets!");
  console.log("Round 1 is waiting for participants.");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
