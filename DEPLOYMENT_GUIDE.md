# 🚀 Blue Raffle Blockhash - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

- [x] Node.js (v18 or higher)
- [x] npm or yarn
- [x] MetaMask or another Web3 wallet
- [x] BNB on BSC Testnet (for gas fees)
- [x] BLUE tokens (for testing)

---

## 🛠️ Step 1: Install Dependencies

### Backend (Hardhat)

```bash
# Install Hardhat dependencies
npm install
```

### Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Return to root
cd ..
```

---

## 🔐 Step 2: Configure Environment

1. **Copy the example environment file:**

```bash
cp .env.example .env
```

2. **Edit `.env` with your values:**

```env
# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# BLUE Token address (BSC Testnet)
BLUE_TOKEN=0xf11Af396703E11D48780B5154E52Fd7b430C6C01

# Wallet addresses (optional - defaults to deployer)
TREASURY_WALLET=0xYourTreasuryWallet
DEVELOPER_WALLET=0xYourDeveloperWallet

# BscScan API key (optional - for verification)
BSCSCAN_API_KEY=your_api_key_here
```

**⚠️ NEVER commit your `.env` file to git!**

---

## 📦 Step 3: Compile Contract

```bash
npm run compile
```

You should see:

```
✓ Compiled 1 Solidity file successfully
```

---

## 🚢 Step 4: Deploy to BSC Testnet

```bash
npm run deploy
```

This will:
1. Deploy the `BlueRaffleBlockhash` contract
2. Export the ABI to `frontend/src/config/abi.json`
3. Export contract address to `frontend/src/config/contract.json`
4. Display deployment info

**Save the contract address!** You'll see output like:

```
✅ BlueRaffleBlockhash deployed to: 0xABC123...
```

---

## 🔍 Step 5: Verify Contract (Optional)

After deployment, verify your contract on BscScan:

```bash
npx hardhat verify --network bsc_testnet <CONTRACT_ADDRESS> "<BLUE_TOKEN>" "<TREASURY>" "<DEVELOPER>"
```

Example:

```bash
npx hardhat verify --network bsc_testnet 0xYourContractAddress "0xf11Af396703E11D48780B5154E52Fd7b430C6C01" "0xYourTreasury" "0xYourDeveloper"
```

---

## 🎨 Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

The app will open at `http://localhost:3000`

---

## ✅ Step 7: Test the Raffle

### Two-Wallet Testing Flow

#### Wallet 1 (First Player):

1. Connect wallet
2. Buy 5-10 BLUE worth of tickets
3. Wait for second player...

#### Wallet 2 (Second Player):

1. Switch to second wallet in MetaMask
2. Connect wallet
3. Buy 5-10 BLUE worth of tickets
4. **Round activates!** Timer starts (5 minutes)

#### After Timer Expires:

5. Either wallet clicks **"Request Draw"**
6. Wait 2 blocks (~6 seconds)
7. Either wallet clicks **"Execute Draw"**
8. Winner is selected! 🎉
9. Winner announcement displays
10. New round auto-starts

---

## 🎯 Testing Edge Cases

### Single Player Scenario:

1. One player buys tickets
2. Timer expires with only 1 player
3. Call `requestDraw()`
4. Player is automatically refunded
5. New round starts

### Admin Functions:

1. Connect with owner wallet
2. Admin panel appears at bottom
3. Test:
   - Pause/Unpause contract
   - Set bonus multiplier (1-10x)
   - Cancel round (emergency)

---

## 🐛 Troubleshooting

### "Contract not loaded" Error

**Problem:** ABI file is empty

**Solution:**
```bash
# Re-compile and deploy
npm run compile
npm run deploy
```

### "Wrong Network" Warning

**Problem:** Wallet not connected to BSC Testnet

**Solution:**
- Click "Switch Network" in the app, or
- Manually add BSC Testnet to MetaMask:
  - Network Name: BSC Testnet
  - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
  - Chain ID: 97
  - Symbol: BNB
  - Explorer: https://testnet.bscscan.com

### "Transfer Failed" Error

**Problem:** Contract not approved to spend BLUE tokens

**Solution:** The app automatically handles approval, but if it fails:
1. Go to BLUE token contract on BscScan
2. Write Contract > `approve`
3. Spender: Raffle contract address
4. Amount: Large number (e.g., 1000000000000000000000)

### "Draw Expired" Error

**Problem:** Waited too long (>250 blocks) after requesting draw

**Solution:**
1. Call `requestDraw()` again
2. Execute within a few minutes

---

## 📊 Admin Panel Features

### Contract Status
- **Pause:** Stops all ticket purchases
- **Unpause:** Resume normal operation

### Bonus Round
- Set ticket multiplier (1-10x)
- Example: 2x = 1 BLUE = 2 tickets

### Emergency Controls
- **Cancel Round:** Refunds all participants, starts new round

---

## 🔄 Continuous Testing Loop

For rapid testing during development:

### Terminal 1 (Backend):
```bash
# Watch for contract changes
npm run compile
```

### Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Terminal 3 (Deployment):
```bash
# Deploy after changes
npm run deploy
```

After each deployment:
1. Frontend auto-updates with new ABI
2. Refresh browser
3. Test new changes

---

## 🔐 Security Checklist

Before mainnet deployment:

- [ ] Audit smart contract code
- [ ] Test all edge cases extensively
- [ ] Verify randomness is unpredictable
- [ ] Test emergency pause/cancel functions
- [ ] Verify fee distributions are correct
- [ ] Test with maximum number of participants
- [ ] Gas optimization review
- [ ] Frontend security audit

---

## 📈 Production Deployment

When ready for mainnet:

1. **Update `hardhat.config.js`:**

```javascript
networks: {
  bsc_mainnet: {
    url: 'https://bsc-dataseed.binance.org',
    chainId: 56,
    accounts: [process.env.PRIVATE_KEY],
  }
}
```

2. **Update frontend config:**

```javascript
// frontend/src/config/contract.json
{
  "network": "bsc_mainnet",
  "chainId": 56,
  "rpcUrl": "https://bsc-dataseed.binance.org",
  "explorerUrl": "https://bscscan.com"
}
```

3. **Deploy to mainnet:**

```bash
npm run deploy -- --network bsc_mainnet
```

4. **Update BLUE token address** to mainnet BLUE token

5. **Verify contract** on BscScan

---

## 🎮 Quick Start Commands

```bash
# Setup
npm install && cd frontend && npm install && cd ..

# Deploy contract
npm run deploy

# Start frontend
cd frontend && npm run dev

# Full reset (clean and redeploy)
npm run clean && npm run compile && npm run deploy
```

---

## 📝 Next Steps

After successful deployment:

1. ✅ Test with two wallets
2. ✅ Verify draw mechanism works
3. ✅ Test edge cases (single player, multiple rounds)
4. ✅ Customize styling (replace `frontend/src/styles/raffle.css`)
5. ✅ Add analytics dashboard (optional)
6. ✅ Mobile testing
7. ✅ Production deployment planning

---

## 🆘 Need Help?

- Check console logs in browser (F12)
- Check terminal output for errors
- Verify contract on BscScan
- Test functions directly on BscScan

---

**Last Updated:** 2025-11-23
**Version:** 1.0.0
