# 🎰 Blue Raffle - Blockhash Edition

A modular, provably fair blockchain raffle system using **blockhash randomness** instead of Chainlink VRF. Built as a reusable template for raffle, casino, and gaming dApps.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Solidity](https://img.shields.io/badge/solidity-0.8.20-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![ethers](https://img.shields.io/badge/ethers-6.10.0-purple)

---

## 🌟 Features

### Smart Contract
- ✅ **Blockhash Randomness** - Provably fair, no oracle required
- ✅ **2-Step Draw Process** - Prevents front-running
- ✅ **Weighted Random Selection** - More tickets = higher chance
- ✅ **Auto-Start Rounds** - Seamless round transitions
- ✅ **Single Player Refunds** - Fair handling of edge cases
- ✅ **Bonus Round System** - Configurable ticket multipliers
- ✅ **Emergency Controls** - Pause, cancel, refund functions
- ✅ **Modular Architecture** - Easy to customize and extend

### Frontend
- ✅ **Real-time Updates** - Live round status and countdown
- ✅ **Wallet Integration** - MetaMask/Web3 support
- ✅ **Winner Announcements** - Animated prize displays
- ✅ **Admin Panel** - Full contract control for owners
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Clean UI** - Simple, focused on testing logic

---

## 📋 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask or Web3 wallet
- BNB on BSC Testnet
- BLUE tokens for testing

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Gummies

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your private key and addresses

# Compile contract
npm run compile

# Deploy to BSC Testnet
npm run deploy

# Start frontend
cd frontend && npm run dev
```

Visit `http://localhost:3000` and connect your wallet!

---

## 🏗️ Project Structure

```
Gummies/
├── contracts/
│   └── BlueRaffleBlockhash.sol    # Main raffle contract
├── scripts/
│   └── deploy.js                   # Deployment script
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app component
│   │   ├── components/
│   │   │   ├── PlayerView/        # Player components
│   │   │   └── AdminPanel/        # Admin components
│   │   ├── hooks/
│   │   │   ├── useWallet.js       # Wallet connection
│   │   │   └── useRaffle.js       # Contract interactions
│   │   ├── config/
│   │   │   ├── contract.json      # Contract address
│   │   │   └── abi.json           # Contract ABI
│   │   └── styles/
│   │       └── raffle.css         # Styling
│   └── package.json
├── hardhat.config.js              # Hardhat configuration
├── package.json
├── .env.example                   # Environment template
├── PROJECT_SPECIFICATION.md       # Full project spec
├── DEPLOYMENT_GUIDE.md           # Deployment instructions
└── TESTING_GUIDE.md              # Testing scenarios
```

---

## 🎮 How It Works

### Round Lifecycle

```
1. WAITING (0-1 players)
   └─> 2nd player joins

2. ACTIVE (timer: 5 minutes)
   └─> Timer expires

3. DRAWING (request sent)
   └─> Wait 2 blocks

4. EXECUTE (blockhash fetched)
   └─> Winner selected

5. COMPLETE (prize distributed)
   └─> New round auto-starts
```

### Blockhash Randomness (2-Step)

**Why 2 steps?**
- Prevents front-running
- Ensures unpredictable randomness
- No oracle costs

**Step 1: Request Draw**
```solidity
function requestDraw() {
    round.drawRequestBlock = block.number;
    // Stores future block number for randomness
}
```

**Step 2: Execute Draw**
```solidity
function executeDraw() {
    bytes32 blockHash = blockhash(targetBlock);
    uint256 randomSeed = keccak256(blockHash, ...);
    // Uses blockhash for provably fair selection
}
```

### Prize Distribution

| Allocation | Percentage | Recipient |
|-----------|-----------|-----------|
| Prize Pool | 94% | Winner |
| Developer | 2% | Dev wallet |
| Burn | 2% | Dead address |
| Seed | 1% | Next round |
| Buyback | 1% | Treasury |

---

## 💻 Usage

### For Players

1. **Connect Wallet**
   ```
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - Switch to BSC Testnet if needed
   ```

2. **Buy Tickets**
   ```
   - Enter BLUE amount (5-150)
   - Click "Buy Tickets"
   - Approve BLUE token spending
   - Confirm transaction
   ```

3. **Wait for Round**
   ```
   - Watch countdown timer
   - See other participants join
   - Get ready for draw!
   ```

4. **Draw Winner**
   ```
   - After timer: Click "Request Draw"
   - Wait 2 blocks (~6 seconds)
   - Click "Execute Draw"
   - Winner announced! 🎉
   ```

5. **Play Again**
   ```
   - Click "Play Again"
   - New round starts automatically
   ```

### For Admins

1. **Access Admin Panel**
   ```
   - Connect with owner wallet
   - Admin panel appears at bottom
   ```

2. **Contract Controls**
   ```
   - Pause/Unpause contract
   - Set bonus multiplier (1-10x)
   - Cancel round (emergency)
   ```

3. **Monitor Rounds**
   ```
   - View live stats
   - Track participants
   - Manage settings
   ```

---

## 🔧 Configuration

### Entry Limits (Adjustable by Admin)

```javascript
Min Tickets: 5 BLUE
Max Tickets: 150 BLUE per wallet
Min Participants: 2 players
Round Duration: 5 minutes (300 seconds)
```

### Bonus Rounds

```javascript
// Set ticket multiplier
await contract.setBonusMultiplier(2); // 2x tickets

// Example:
// Normal: 10 BLUE = 10 tickets
// 2x Bonus: 10 BLUE = 20 tickets
```

---

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive test scenarios.

### Quick Test (2 Wallets)

```bash
# Terminal 1
cd frontend && npm run dev

# Browser 1: Wallet A
http://localhost:3000

# Browser 2: Wallet B (incognito)
http://localhost:3000
```

**Test Flow:**
1. Wallet A: Buy 10 BLUE tickets
2. Wallet B: Buy 15 BLUE tickets (round activates)
3. Wait 5 minutes
4. Either wallet: Request Draw → Execute Draw
5. Winner selected! 🎉

---

## 📊 Smart Contract API

### Read Functions

```solidity
getCurrentRoundInfo() → (roundId, startTime, endTime, prizePool, totalTickets, uniqueWallets, status, timeRemaining)

getRoundDetails(roundId) → (winner, winnerPrize, prizePool, totalTickets, status, randomSeed)

getUserTickets(roundId, user) → uint256

canRequestDraw() → (bool, string)

canExecuteDraw() → (bool, string)
```

### Write Functions

```solidity
buyTickets(uint256 blueAmount)

requestDraw()

executeDraw()
```

### Admin Functions

```solidity
setBonusMultiplier(uint256 multiplier)

setEntryLimits(min, max, minParticipants)

setRoundDuration(uint256 duration)

pause() / unpause()

cancelRound()
```

---

## 🔐 Security

### Smart Contract
- ✅ OpenZeppelin contracts (Ownable, ReentrancyGuard, Pausable)
- ✅ 2-step blockhash prevents manipulation
- ✅ Input validation on all functions
- ✅ Emergency pause/cancel functions
- ✅ Reentrancy protection

### Blockhash Considerations
- ✅ Must execute within 256 blocks (prevents stale randomness)
- ✅ Random seed includes multiple inputs (blockhash + metadata)
- ✅ No oracle dependencies (no VRF costs/risks)

---

## 🚀 Deployment

### BSC Testnet (Current)

```bash
npm run deploy
```

Deployed at: `0x3fBf13B39AC4f8C9C75BD9F7751e2C65047E597E` (example)

### BSC Mainnet (Production)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full instructions.

---

## 🎨 Customization

### Styling

Replace `frontend/src/styles/raffle.css` with your custom CSS.

Current theme:
- Dark mode
- Blue accent colors
- Card-based layout
- Responsive design

### Token Integration

Change BLUE token to any ERC20:

```env
BLUE_TOKEN=0xYourTokenAddress
```

Update contract:
```solidity
IERC20 public immutable blueToken; // Already supports any ERC20
```

### Game Parameters

Modify in contract or via admin panel:
- Entry limits (min/max tickets)
- Round duration
- Prize distribution percentages
- Bonus multipliers

---

## 📈 Roadmap

### Phase 1: Core Logic (✅ Complete)
- [x] Blockhash randomness
- [x] 2-step draw process
- [x] Basic frontend
- [x] Admin panel
- [x] Two-wallet testing

### Phase 2: Enhancements
- [ ] Mobile optimization
- [ ] Round history browser
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark/light theme toggle

### Phase 3: Advanced Features
- [ ] NFT ticket system
- [ ] Referral rewards
- [ ] Leaderboards
- [ ] Social sharing
- [ ] Automated rounds

### Phase 4: Production
- [ ] Security audit
- [ ] Gas optimization
- [ ] Mainnet deployment
- [ ] Marketing materials

---

## 🛠️ Tech Stack

**Smart Contracts:**
- Solidity 0.8.20
- OpenZeppelin Contracts
- Hardhat

**Frontend:**
- React 18
- Vite
- ethers.js v6
- ES Modules

**Network:**
- BSC Testnet (chainId: 97)
- BSC Mainnet ready

---

## 📝 Documentation

- [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) - Full project spec
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing scenarios

---

## 🤝 Contributing

This is a modular template designed for:
- Raffle systems
- Casino games
- Lottery dApps
- Any game requiring fair randomness

Feel free to fork and customize for your use case!

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

Issues? Questions?

1. Check the documentation
2. Review test scenarios
3. Verify contract on BscScan
4. Check browser console logs

---

## 🎉 Credits

Built with ❤️ for the blockchain gaming community.

**Powered by:**
- Blockhash randomness
- OpenZeppelin
- React + ethers.js
- BSC Network

---

**Last Updated:** 2025-11-23
**Version:** 2.0.0
**Status:** ✅ Ready for Testing
