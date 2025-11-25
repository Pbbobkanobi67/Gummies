# Blue Dice

Provably fair dice game for Blue Protocol on BNB Chain. Part of the Blue Casino ecosystem.

## Features

- **Multiple Bet Types**: Exact number, Over/Under, Odd/Even
- **Provably Fair**: Blockhash-based randomness with 2-step commit-reveal pattern
- **BLUE Token Integration**: Bet with BLUE tokens
- **House Edge Distribution**: 3% total (2% treasury, 1% burned)
- **Modular Design**: Built for Blue Casino integration

## Bet Types & Payouts

| Type | Description | Multiplier |
|------|-------------|------------|
| Exact | Guess exact number (1-6) | 5.82x |
| Odd | Roll 1, 3, or 5 | 1.94x |
| Even | Roll 2, 4, or 6 | 1.94x |
| Over | Roll higher than X | Variable |
| Under | Roll lower than X | Variable |

## Tech Stack

- **Smart Contract**: Solidity 0.8.20, OpenZeppelin 5.x
- **Frontend**: React 18, Vite, ethers.js v6
- **Network**: BNB Smart Chain (Testnet/Mainnet)

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- BNB for gas fees
- BLUE tokens for betting

### Installation

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Copy environment file
cp .env.example .env
# Edit .env with your private key
```

### Deploy Contract

```bash
# Compile
npm run compile

# Deploy to BSC Testnet
npm run deploy
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3001 in your browser.

## Contract Configuration

| Parameter | Default |
|-----------|---------|
| Min Bet | 5 BLUE |
| Max Bet | 500 BLUE |
| Max Payout | 5,000 BLUE |
| House Edge | 3% |
| Blocks to Wait | 2 |

## Architecture

### Smart Contract Flow

1. **Place Bet**: User approves BLUE tokens and calls `placeBet()`
2. **Wait**: 2 blocks must pass (~6 seconds on BSC)
3. **Roll**: Anyone can call `rollDice()` to resolve the bet
4. **Result**: Blockhash determines random outcome (1-6)

### Security Features

- ReentrancyGuard on all state-changing functions
- Pausable for emergency stops
- 2-step commit-reveal prevents front-running
- House bankroll limits max payouts

## Project Structure

```
blue-dice/
├── contracts/
│   └── BlueDice.sol         # Main game contract
├── scripts/
│   └── deploy.js            # Deployment script
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # useWallet, useDice
│   │   ├── pages/           # Home, History, Admin
│   │   ├── config/          # Contract ABI & address
│   │   └── styles/          # CSS
│   └── package.json
├── hardhat.config.js
└── package.json
```

## Environment Variables

```
PRIVATE_KEY=           # Deployer wallet private key
BLUE_TOKEN=            # BLUE token address
TREASURY_WALLET=       # Treasury address for fees
BSCSCAN_API_KEY=       # For contract verification
```

## Admin Functions

- `fundHouse(amount)` - Add BLUE to house bankroll
- `withdrawHouse(amount)` - Withdraw from bankroll (owner)
- `setLimits(min, max, maxPayout)` - Update betting limits (owner)
- `pause() / unpause()` - Emergency controls (owner)

## Blue Casino Integration

This contract is designed to integrate with the Blue Casino ecosystem:

- Shared treasury wallet
- Consistent house edge model
- Compatible with Blue Raffle
- Future: Shared loyalty/rewards system

## License

MIT
