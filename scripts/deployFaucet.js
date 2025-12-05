const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const INITIAL_FUND = "100000"; // Fund with 100,000 BLUE initially

  console.log("=".repeat(60));
  console.log("Deploying BlueFaucet Contract");
  console.log("=".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  // Deploy Faucet
  console.log("\nDeploying BlueFaucet...");
  const BlueFaucet = await hre.ethers.getContractFactory("BlueFaucet");
  const faucet = await BlueFaucet.deploy(BLUE_TOKEN);
  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("BlueFaucet deployed to:", faucetAddress);

  // Fund the faucet
  console.log("\nFunding faucet with", INITIAL_FUND, "BLUE...");

  const blueToken = await hre.ethers.getContractAt(
    ["function approve(address spender, uint256 amount) returns (bool)",
     "function transfer(address to, uint256 amount) returns (bool)",
     "function balanceOf(address account) view returns (uint256)"],
    BLUE_TOKEN,
    deployer
  );

  const deployerBalance = await blueToken.balanceOf(deployer.address);
  console.log("Deployer BLUE balance:", hre.ethers.formatEther(deployerBalance));

  if (deployerBalance >= hre.ethers.parseEther(INITIAL_FUND)) {
    // Transfer tokens directly to faucet
    const tx = await blueToken.transfer(faucetAddress, hre.ethers.parseEther(INITIAL_FUND));
    await tx.wait();
    console.log("Faucet funded!");
  } else {
    console.log("Insufficient balance to fund faucet. Fund manually later.");
  }

  const faucetBalance = await blueToken.balanceOf(faucetAddress);
  console.log("Faucet balance:", hre.ethers.formatEther(faucetBalance), "BLUE");

  // Save contract info for frontend
  const contractInfo = {
    address: faucetAddress,
    network: "bsc_testnet",
    chainId: 97,
    blueToken: BLUE_TOKEN
  };

  const frontendConfigPath = path.join(__dirname, "../frontend/src/config/faucetContract.json");
  fs.writeFileSync(frontendConfigPath, JSON.stringify(contractInfo, null, 2));
  console.log("\nContract config saved to frontend");

  // Save ABI
  const artifact = await hre.artifacts.readArtifact("BlueFaucet");
  const abiPath = path.join(__dirname, "../frontend/src/config/faucetAbi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("ABI saved to frontend");

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Faucet Address:", faucetAddress);
  console.log("Claim Amount: 1,000 BLUE");
  console.log("Cooldown: 24 hours");
  console.log("Explorer:", `https://testnet.bscscan.com/address/${faucetAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
