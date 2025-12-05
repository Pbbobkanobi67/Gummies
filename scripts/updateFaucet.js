const hre = require("hardhat");

async function main() {
  const FAUCET_ADDRESS = "0x721E516faE64DeefB465552C971D396719914c66";
  const NEW_CLAIM_AMOUNT = "10000"; // 10,000 BLUE per claim

  const [owner] = await hre.ethers.getSigners();
  console.log("Owner:", owner.address);

  const faucet = await hre.ethers.getContractAt(
    ["function setClaimAmount(uint256 newAmount)",
     "function claimAmount() view returns (uint256)",
     "function faucetBalance() view returns (uint256)"],
    FAUCET_ADDRESS,
    owner
  );

  console.log("\nCurrent claim amount:", hre.ethers.formatEther(await faucet.claimAmount()), "BLUE");
  console.log("Faucet balance:", hre.ethers.formatEther(await faucet.faucetBalance()), "BLUE");

  console.log("\nSetting claim amount to", NEW_CLAIM_AMOUNT, "BLUE...");
  const tx = await faucet.setClaimAmount(hre.ethers.parseEther(NEW_CLAIM_AMOUNT));
  await tx.wait();

  console.log("New claim amount:", hre.ethers.formatEther(await faucet.claimAmount()), "BLUE");
  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
