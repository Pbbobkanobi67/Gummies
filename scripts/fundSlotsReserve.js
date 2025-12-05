const hre = require("hardhat");

// Configuration
const BLUE_TOKEN = process.env.BLUE_TOKEN || "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
const BLUE_SLOTS_ADDRESS = "0x5d5d7c1d9546C59f023f9DA40c96Ac5a2bC5Ffbe";
const RESERVE_AMOUNT = "5000"; // 5000 BLUE tokens

// ERC20 ABI for approve and transfer
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

async function main() {
  console.log('Funding BlueSlots house reserve...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Funder:', deployer.address);

  // Get BLUE token contract
  const blueToken = new hre.ethers.Contract(BLUE_TOKEN, ERC20_ABI, deployer);

  // Check balance
  const balance = await blueToken.balanceOf(deployer.address);
  console.log('BLUE balance:', hre.ethers.formatEther(balance), 'BLUE');

  const amountToDeposit = hre.ethers.parseEther(RESERVE_AMOUNT);
  console.log('Amount to deposit:', RESERVE_AMOUNT, 'BLUE');

  if (balance < amountToDeposit) {
    console.error('Insufficient BLUE balance!');
    process.exit(1);
  }

  // Get BlueSlots contract
  const blueSlots = await hre.ethers.getContractAt("BlueSlots", BLUE_SLOTS_ADDRESS);

  // Approve spending
  console.log('\nApproving BLUE tokens...');
  const approveTx = await blueToken.approve(BLUE_SLOTS_ADDRESS, amountToDeposit);
  await approveTx.wait();
  console.log('Approved!');

  // Deposit to reserve
  console.log('Depositing to house reserve...');
  const depositTx = await blueSlots.depositToReserve(amountToDeposit);
  await depositTx.wait();
  console.log('Deposited!');

  // Verify
  const newReserve = await blueSlots.houseReserve();
  console.log('\nNew house reserve:', hre.ethers.formatEther(newReserve), 'BLUE');

  // Calculate max bet based on reserve
  const maxBetForReserve = await blueSlots.getMaxBetForReserve();
  console.log('Max bet for current reserve:', hre.ethers.formatEther(maxBetForReserve), 'BLUE');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
