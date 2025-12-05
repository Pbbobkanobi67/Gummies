const hre = require("hardhat");

async function main() {
  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const FAUCET_ADDRESS = "0x721E516faE64DeefB465552C971D396719914c66";

  const token = await hre.ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    BLUE_TOKEN
  );

  const balance = await token.balanceOf(FAUCET_ADDRESS);
  console.log("Faucet balance:", hre.ethers.formatEther(balance), "BLUE");
}

main();
