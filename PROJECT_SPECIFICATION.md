# 🎰 Modular Raffle System - Project Specification

## 📋 Overview
A modular, blockchain-based raffle system using **blockhash randomness** for provably fair winner selection. Designed as a reusable template for raffle, casino, and gaming dApps.

---

## 🎯 Core Requirements

### 1. Entry System
- **Token**: BLUE token (ERC20)
- **Ticket Ratio**: 1 BLUE = 1 ticket (default)
- **Bonus Rounds**: Admin can set multiplier (1 BLUE = X tickets)
- **Entry Limits**:
  - Minimum: 5 tickets per wallet
  - Maximum: 150 tickets per wallet
  - Both adjustable by admin

### 2. Random Number Generation
- **Method**: Blockhash (not Chainlink VRF)
- **2-Step Draw Process**:
  1. `requestDraw()` - Stores target block number
  2. `executeDraw()` - Uses blockhash from stored block for randomness
- **Security**: Prevents front-running and manipulation

### 3. Prize Distribution
- **Winner**: Single winner per round
- **Fee Breakdown**:
  - 94% → Prize Pool (winner)
  - 2% → Developer wallet
  - 2% → Burn (dead address)
  - 1% → Seed next round
  - 1% → Buyback/Treasury

### 4. Round Flow Logic

#### Round Lifecycle:
```
WAITING (0-1 players)
    ↓ (2nd player enters)
ACTIVE (timer starts: 5 minutes)
    ↓ (timer expires)
DRAWING (requestDraw called)
    ↓ (1-2 blocks later)
COMPLETE (executeDraw called, winner selected)
    ↓
ANNOUNCE WINNER
    ↓
NEW ROUND (auto-start)
```

#### Edge Cases:
- **Only 1 player when round ends**: Refund tickets, reset to new round
- **Minimum participants**: 2 players required to draw
- **Auto-start**: New round begins after winner announcement

### 5. Admin Controls
- Pause/unpause contract
- Adjust entry limits (min/max tickets)
- Set bonus multiplier for special rounds
- Update fee distribution percentages
- Set round duration
- Emergency functions (recover stuck funds, cancel round)
- View analytics (total rounds, volume, participants)

---

## 🏗️ Technical Architecture

### Smart Contract Structure (Modular)

```
BlueRaffle.sol (Main Contract)
├── Ownable (Access Control)
├── ReentrancyGuard (Security)
├── Pausable (Emergency Stop)
└── Modules:
    ├── EntryModule (Ticket purchasing logic)
    ├── DrawModule (Blockhash randomness logic)
    ├── DistributionModule (Prize/fee distribution)
    └── RoundModule (Round lifecycle management)
```

### Frontend Structure (React + Vite)

```
frontend/
├── src/
│   ├── App.jsx (Main app)
│   ├── components/
│   │   ├── PlayerView/
│   │   │   ├── RaffleCard.jsx (Current round info)
│   │   │   ├── TicketPurchase.jsx (Buy tickets)
│   │   │   ├── WinnerAnnouncement.jsx (Show winner)
│   │   │   └── PlayAgainPrompt.jsx (Re-entry)
│   │   └── AdminPanel/
│   │       ├── ContractControls.jsx (Pause, settings)
│   │       ├── RoundManagement.jsx (Manual controls)
│   │       └── Analytics.jsx (Stats dashboard)
│   ├── hooks/
│   │   ├── useRaffleContract.js (Contract interactions)
│   │   ├── useRoundStatus.js (Real-time round data)
│   │   └── useWalletConnect.js (Wallet connection)
│   ├── config/
│   │   └── raffle.config.js (Contract address, ABI, network)
│   └── styles/
│       └── raffle.css (Styling - provided by user)
└── package.json
```

---

## 🎮 User Flow (Testing Focus)

### Player Experience:
1. Connect wallet
2. See current round status (WAITING/ACTIVE)
3. Buy tickets (5-150 BLUE)
4. Wait for round to complete
5. See winner announcement
6. Prompted to play again
7. Enter new round

### Admin Experience:
1. Connect admin wallet
2. Access admin panel
3. Monitor live rounds
4. Adjust parameters as needed
5. Emergency controls if needed

---

## 🔐 Security Features

### Smart Contract:
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Blockhash randomness (2-step to prevent manipulation)
- ✅ Pausable for emergencies
- ✅ Access control (onlyOwner for admin functions)
- ✅ Input validation (min/max limits, valid addresses)

### Blockhash Considerations:
- Must call `executeDraw()` within 256 blocks of `requestDraw()`
- Auto-revert if blockhash unavailable (protects integrity)
- Store block number, not blockhash directly

---

## 📊 Testing Requirements

### Phase 1: Logic Testing (Current Focus)
- ✅ Two dummy wallets
- ✅ 5-minute rounds
- ✅ Complete round successfully
- ✅ Winner selection works
- ✅ Winner announcement displays
- ✅ Play-again flow works
- ✅ New round auto-starts
- ✅ Single-player refund works

### Phase 2: Edge Cases
- Multiple rounds in sequence
- Maximum participants
- Bonus round multiplier
- Emergency pause/unpause

### Phase 3: Production
- Mainnet deployment
- Gas optimization
- Frontend polish
- Mobile responsiveness

---

## 🛠️ Technology Stack

### Blockchain:
- **Network**: BSC Testnet (deployed at `0x3fBf13B39AC4f8C9C75BD9F7751e2C65047E597E`)
- **Solidity**: ^0.8.20
- **Framework**: Hardhat
- **Token**: BLUE (ERC20)

### Frontend:
- **Framework**: React 18
- **Build Tool**: Vite
- **Web3**: ethers.js v6
- **Module System**: ES Modules
- **Styling**: Custom CSS (user-provided)

### Development:
- **Package Manager**: npm
- **Testing**: Hardhat + Ethers
- **Deployment**: Hardhat scripts

---

## 📦 Deliverables

### Smart Contract:
- ✅ BlueRaffle.sol (blockhash-based)
- ✅ Deployment script
- ✅ ABI export
- ✅ Verification script

### Frontend:
- ✅ React app with player view
- ✅ Admin panel
- ✅ Real-time round updates
- ✅ Wallet connection
- ✅ Winner announcements
- ✅ Play-again prompts

### Documentation:
- ✅ Deployment guide
- ✅ Testing guide
- ✅ Admin manual
- ✅ Player instructions

---

## 🎨 Styling Notes

- User will provide CSS file and screenshots
- Focus: **Simple, functional UI for logic testing**
- Priority: Clear display of round status and winner
- Defer: Complex animations, mobile optimization (Phase 3)

---

## 🚀 Next Steps

1. ✅ Create smart contract with blockhash randomness
2. ✅ Set up Hardhat project
3. ✅ Build React frontend (simple version)
4. ✅ Test with two wallets
5. ✅ Iterate based on results

---

## 📝 Future Enhancements (Template Features)

- Multi-token support (any ERC20)
- Multiple winners per round
- NFT ticket system
- Referral rewards
- Leaderboards
- Historical round browser
- Advanced analytics
- Mobile app (React Native)

---

**Version**: 1.0
**Date**: 2025-11-23
**Status**: In Development
