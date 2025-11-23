import { config as dotenvConfig } from 'dotenv';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-verify';

dotenvConfig();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bsc_testnet: {
      url: 'https://rpc.ankr.com/bsc_testnet_chapel',
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 gwei
      timeout: 60000,
    },
    hardhat: {
      chainId: 1337,
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || '',
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};
