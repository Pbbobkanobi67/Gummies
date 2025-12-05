const hre = require("hardhat");

async function main() {
  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
  const RECIPIENT = "0x721E516faE64DeefB465552C971D396719914c66"; // Faucet contract
  const AMOUNT = "400";

  const [sender] = await hre.ethers.getSigners();
  console.log("Sender:", sender.address);
  console.log("Recipient:", RECIPIENT);
  console.log("Amount:", AMOUNT, "BLUE");

  const blueToken = await hre.ethers.getContractAt(
    ["function transfer(address to, uint256 amount) returns (bool)",
     "function balanceOf(address account) view returns (uint256)"],
    BLUE_TOKEN,
    sender
  );

  const senderBalance = await blueToken.balanceOf(sender.address);
  console.log("Sender Balance:", hre.ethers.formatEther(senderBalance), "BLUE");

  const amountWei = hre.ethers.parseEther(AMOUNT);
  console.log("\nSending tokens...");
  const tx = await blueToken.transfer(RECIPIENT, amountWei);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Confirmed!");

  const recipientBalance = await blueToken.balanceOf(RECIPIENT);
  console.log("\nRecipient Balance:", hre.ethers.formatEther(recipientBalance), "BLUE");
  console.log("Explorer:", `https://testnet.bscscan.com/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
