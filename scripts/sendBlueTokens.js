const hre = require("hardhat");
const readline = require("readline");

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Configuration
  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";

  console.log("=".repeat(60));
  console.log("Send BLUE Tokens");
  console.log("=".repeat(60));

  // Prompt for recipient address
  const RECIPIENT = await prompt("\nEnter recipient wallet address: ");

  if (!RECIPIENT || !RECIPIENT.startsWith("0x") || RECIPIENT.length !== 42) {
    console.log("\nError: Invalid wallet address!");
    console.log("Address must start with 0x and be 42 characters long.");
    process.exit(1);
  }

  // Prompt for amount
  const amountInput = await prompt("Enter amount to send (default: 50000): ");
  const AMOUNT = amountInput || "50000";

  const [sender] = await hre.ethers.getSigners();
  console.log("\nSender:", sender.address);
  console.log("Recipient:", RECIPIENT);
  console.log("Amount:", AMOUNT, "BLUE");

  // Get BLUE token contract
  const blueToken = await hre.ethers.getContractAt(
    ["function transfer(address to, uint256 amount) returns (bool)",
     "function balanceOf(address account) view returns (uint256)",
     "function symbol() view returns (string)"],
    BLUE_TOKEN,
    sender
  );

  // Check sender balance
  const senderBalance = await blueToken.balanceOf(sender.address);
  console.log("\nSender Balance:", hre.ethers.formatEther(senderBalance), "BLUE");

  const amountWei = hre.ethers.parseEther(AMOUNT);

  if (senderBalance < amountWei) {
    console.log("\nError: Insufficient balance!");
    process.exit(1);
  }

  // Send tokens
  console.log("\nSending tokens...");
  const tx = await blueToken.transfer(RECIPIENT, amountWei);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("Confirmed!");

  // Check new balances
  const newSenderBalance = await blueToken.balanceOf(sender.address);
  const recipientBalance = await blueToken.balanceOf(RECIPIENT);

  console.log("\n--- Updated Balances ---");
  console.log("Sender:", hre.ethers.formatEther(newSenderBalance), "BLUE");
  console.log("Recipient:", hre.ethers.formatEther(recipientBalance), "BLUE");

  console.log("\n" + "=".repeat(60));
  console.log("TRANSFER COMPLETE");
  console.log("=".repeat(60));
  console.log("Explorer:", `https://testnet.bscscan.com/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
