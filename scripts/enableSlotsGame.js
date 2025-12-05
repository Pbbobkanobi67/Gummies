const hre = require("hardhat");

const GAME_MANAGER_ADDRESS = "0x0b034C11B659b357Ba820Cf2fED3A9CBcA1c223B";

async function main() {
  console.log('Enabling Blue Slots game...\n');

  const [deployer] = await hre.ethers.getSigners();
  const gameManager = await hre.ethers.getContractAt("GameManager", GAME_MANAGER_ADDRESS);

  // Get current status
  const gameBefore = await gameManager.getGame('slots');
  console.log('Current status:');
  console.log('  Enabled:', gameBefore.enabled);
  console.log('  Visible:', gameBefore.visible);
  console.log('  Featured:', gameBefore.featured);
  console.log('  Contract:', gameBefore.contractAddress);

  // Enable the game (make it playable)
  console.log('\nSetting enabled: true...');
  const tx = await gameManager.setGameEnabled('slots', true);
  await tx.wait();

  // Verify
  const gameAfter = await gameManager.getGame('slots');
  console.log('\nNew status:');
  console.log('  Enabled:', gameAfter.enabled, '(playable)');
  console.log('  Visible:', gameAfter.visible, '(shows in UI)');
  console.log('  Featured:', gameAfter.featured);

  console.log('\nBlue Slots is now LIVE!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
