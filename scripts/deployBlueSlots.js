const hre = require("hardhat");

// Configuration
const BLUE_TOKEN = process.env.BLUE_TOKEN || "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
const TREASURY_WALLET = process.env.TREASURY_WALLET || "0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2";
const GAME_MANAGER_ADDRESS = "0x0b034C11B659b357Ba820Cf2fED3A9CBcA1c223B";

async function main() {
  console.log('Deploying BlueSlots to BSC Testnet...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'BNB\n');

  // Deploy BlueSlots
  console.log('Deploying BlueSlots...');
  console.log('  BLUE Token:', BLUE_TOKEN);
  console.log('  Treasury:', TREASURY_WALLET);

  const BlueSlots = await hre.ethers.getContractFactory("BlueSlots");
  const blueSlots = await BlueSlots.deploy(BLUE_TOKEN, TREASURY_WALLET);
  await blueSlots.waitForDeployment();

  const slotsAddress = await blueSlots.getAddress();
  console.log('\nBlueSlots deployed to:', slotsAddress);

  // Verify deployment
  console.log('\nVerifying deployment...');
  const minBet = await blueSlots.minBet();
  const maxBet = await blueSlots.maxBet();
  const houseReserve = await blueSlots.houseReserve();
  const treasury = await blueSlots.treasuryWallet();

  console.log('  Min bet:', hre.ethers.formatEther(minBet), 'BLUE');
  console.log('  Max bet:', hre.ethers.formatEther(maxBet), 'BLUE');
  console.log('  House reserve:', hre.ethers.formatEther(houseReserve), 'BLUE');
  console.log('  Treasury:', treasury);

  // Update GameManager with the real contract address
  console.log('\nUpdating GameManager with BlueSlots address...');
  const gameManager = await hre.ethers.getContractAt("GameManager", GAME_MANAGER_ADDRESS);

  try {
    const tx = await gameManager.updateGame(
      'slots',
      'Blue Slots',
      '3-reel slot machine with multiple winning combinations.',
      slotsAddress
    );
    await tx.wait();
    console.log('GameManager updated with BlueSlots address!');
  } catch (err) {
    console.log('Note: Could not update GameManager. You may need to do this manually.');
    console.log('Error:', err.message);
  }

  // Summary
  console.log('\n========================================');
  console.log('DEPLOYMENT COMPLETE');
  console.log('========================================');
  console.log('BlueSlots Address:', slotsAddress);
  console.log('\nNext steps:');
  console.log('1. Fund the house reserve with BLUE tokens');
  console.log('   Run: npx hardhat run scripts/fundSlotsReserve.js --network bsc_testnet');
  console.log('2. Enable slots in GameManager');
  console.log('   Run: npx hardhat run scripts/enableSlotsGame.js --network bsc_testnet');
  console.log('3. Update frontend with contract address');
  console.log('\nAdd to frontend/.env.local:');
  console.log(`VITE_BLUE_SLOTS_ADDRESS=${slotsAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
