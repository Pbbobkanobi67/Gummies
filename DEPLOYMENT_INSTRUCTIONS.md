# Deploy BlueRaffle FIXED Contract

## 🎯 What This Will Do

Deploy the **FIXED** BlueRaffle contract with:
- ✅ Correct VRF Subscription ID: `43371163114061566586232043748699703279439038188185138377217877577027786652944`
- ✅ Fixed hardcoded activation bug (uses `minParticipants` instead of `2`)
- ✅ Emergency recovery functions added
- ✅ Enhanced diagnostics
- ✅ Ability to update VRF config without redeployment

---

## 📋 Prerequisites

Before deploying, make sure you have:

- [ ] Hardhat installed (`npm install --save-dev hardhat`)
- [ ] Private key for your admin wallet (`0xa757d90e353b3E045721A41236831238Fc84024F`)
- [ ] At least 0.1 BNB on BNB testnet for gas
- [ ] VRF subscription with LINK balance
- [ ] Contract file: `BlueRaffle_FIXED.sol` in your `contracts/` folder

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Project

1. **Copy the fixed contract** to your Hardhat project:
   ```bash
   # In your Blue-Raffle folder
   cp BlueRaffle_FIXED.sol contracts/BlueRaffle.sol
   ```

2. **Copy the deployment script**:
   ```bash
   cp deploy-fixed-contract.js scripts/deploy.js
   ```

3. **Create your .env file**:
   ```bash
   cp .env.example .env
   ```

4. **Edit .env** with your actual values:
   ```env
   PRIVATE_KEY=your_actual_private_key_here
   MOCK_BLUE_TOKEN=0xf11Af396703E11D48780B5154E52Fd7b430C6C01
   TREASURY_WALLET=0xa757d90e353b3E045721A41236831238Fc84024F
   DEVELOPER_WALLET=0xa757d90e353b3E045721A41236831238Fc84024F
   VRF_SUBSCRIPTION_ID=43371163114061566586232043748699703279439038188185138377217877577027786652944
   VRF_KEY_HASH=0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314
   ```

### Step 2: Compile the Contract

```bash
npx hardhat compile
```

You should see:
```
✓ Compiled 1 Solidity file successfully
```

### Step 3: Deploy to BNB Testnet

```bash
npx hardhat run scripts/deploy.js --network bsc_testnet
```

### Step 4: Save the Contract Address

The script will output something like:
```
✅ BlueRaffle FIXED deployed to: 0xABC123...
```

**Copy this address!** You'll need it for the next steps.

### Step 5: Add Contract to VRF Subscription

1. Go to: https://vrf.chain.link/bnb-chain-testnet
2. Connect your admin wallet
3. Find your subscription: `43371163114061566586232043748699703279439038188185138377217877577027786652944`
4. Click **"Add Consumer"**
5. Paste your new contract address
6. Confirm the transaction

### Step 6: Update Frontend

Update your `frontend/src/config.js`:

```javascript
export const CONTRACT_ADDRESS = "0xYOUR_NEW_CONTRACT_ADDRESS";
```

### Step 7: Test the Deployment

Run the diagnostic tool on the new contract:

1. Edit `diagnose-local.html`
2. Change line 84:
   ```javascript
   contractAddress: '0xYOUR_NEW_CONTRACT_ADDRESS',
   ```
3. Open in browser and run diagnostics
4. Should show "Contract Paused: NO" and "Round Status: Pending"

### Step 8: Test Full Flow

1. **Buy tickets** with 2 different wallets (5 BLUE minimum each)
2. **Wait for timer** (5 minutes)
3. **Close round** - should work now!
4. **Verify winner** is selected

---

## 🔧 Troubleshooting

### "Insufficient funds for intrinsic transaction cost"
**Solution:** Add more BNB to your deployer wallet

### "Contract not verified"
**Manual verification:**
```bash
npx hardhat verify --network bsc_testnet YOUR_CONTRACT_ADDRESS \
  "0xf11Af396703E11D48780B5154E52Fd7b430C6C01" \
  "0xa757d90e353b3E045721A41236831238Fc84024F" \
  "0xa757d90e353b3E045721A41236831238Fc84024F" \
  "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f" \
  "43371163114061566586232043748699703279439038188185138377217877577027786652944" \
  "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314"
```

### "VRF request failed"
**Possible causes:**
- Contract not added as consumer (go back to Step 5)
- Subscription has no LINK balance (add testnet LINK)
- Subscription doesn't exist (verify subscription ID)

---

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Contract deployed and verified on BscScan
- [ ] Contract added as VRF consumer
- [ ] VRF subscription has LINK balance (check: https://faucets.chain.link/bnb-chain-testnet)
- [ ] Frontend config.js updated with new address
- [ ] Diagnostic tool shows contract ready
- [ ] Tested buying tickets with 2 wallets
- [ ] Tested closing round after timer
- [ ] Winner successfully selected

---

## 🆘 If Deployment Fails

If you encounter any issues:

1. **Check your .env file** - all values correct?
2. **Check BNB balance** - need ~0.1 BNB for gas
3. **Check network** - connected to BNB testnet?
4. **Check Hardhat config** - network properly configured?

**Share the error message** and I can help debug!

---

## 🎉 Success!

Once deployed:
- Your old contract is at: `0x99121F45cB98b38360970e4f7c268da5aD0FFDda` (will be abandoned)
- Your new contract is at: `0xYOUR_NEW_ADDRESS` (use this one!)

The new contract has:
- Correct VRF subscription
- Fixed activation bug
- Emergency functions
- Better diagnostics

**You're ready for production testing!** 🚀

---

## 🔄 Quick Deploy Commands

```bash
# Complete deployment in one go
npx hardhat compile && npx hardhat run scripts/deploy.js --network bsc_testnet
```

---

Last Updated: 2025-11-21
Version: 1.1 (FIXED)
