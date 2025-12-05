const hre = require("hardhat");

async function main() {
  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const FAUCET_ADDRESS = "0x721E516faE64DeefB465552C971D396719914c66";
  const MINT_AMOUNT = "1000000"; // 1 million BLUE

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  const token = await hre.ethers.getContractAt(
    [
      "function mint(address to, uint256 amount)",
      "function owner() view returns (address)",
      "function balanceOf(address) view returns (uint256)"
    ],
    BLUE_TOKEN,
    signer
  );

  try {
    const owner = await token.owner();
    console.log("Token owner:", owner);
    console.log("Is owner:", owner.toLowerCase() === signer.address.toLowerCase());

    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log("\nMinting", MINT_AMOUNT, "BLUE to faucet...");
      const tx = await token.mint(FAUCET_ADDRESS, hre.ethers.parseEther(MINT_AMOUNT));
      await tx.wait();
      console.log("Minted!");

      const balance = await token.balanceOf(FAUCET_ADDRESS);
      console.log("Faucet balance:", hre.ethers.formatEther(balance), "BLUE");
    } else {
      console.log("You are not the token owner. Cannot mint.");
    }
  } catch (e) {
    console.log("Error:", e.message);

    // Maybe no owner function, try minting anyway
    console.log("\nTrying to mint anyway...");
    try {
      const tx = await token.mint(FAUCET_ADDRESS, hre.ethers.parseEther(MINT_AMOUNT));
      await tx.wait();
      console.log("Minted!");
    } catch (e2) {
      console.log("Mint failed:", e2.reason || e2.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
