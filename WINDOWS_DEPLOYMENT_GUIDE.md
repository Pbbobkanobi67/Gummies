# Windows Deployment Guide for Blue Raffle

## 🎯 Automated Deployment (Easy Mode)

I've created Windows batch scripts to automate everything!

---

## 📋 Before You Start

You need:
- [ ] Git for Windows installed
- [ ] Node.js installed (v16 or higher)
- [ ] Your admin wallet private key
- [ ] At least 0.1 BNB on BNB testnet

---

## 🚀 Step-by-Step (3 Easy Steps!)

### Step 1: Pull the Latest Code

Open **Command Prompt** or **Git Bash** in your project folder:

```cmd
cd C:\Users\bob\Blue-Raffle
git fetch origin
git checkout claude/blue-raffle-dapp-01KdSVRdN6wEHzcuv2Jg96S8
git pull
```

You should now have these new files:
- `deploy.bat` ⭐
- `check-setup.bat` ⭐
- `BlueRaffle_FIXED.sol`
- `deploy-fixed-contract.js`
- `.env.example`

### Step 2: Check Your Setup (Optional but Recommended)

Double-click `check-setup.bat` or run:
```cmd
check-setup.bat
```

This will verify:
- ✅ Node.js and npm are installed
- ✅ Project structure is correct
- ✅ All deployment files are present
- ✅ Hardhat is installed

If anything is missing, it will tell you what to fix.

### Step 3: Deploy!

**Double-click `deploy.bat`** or run:
```cmd
deploy.bat
```

The script will:
1. ✅ Check all files exist
2. ✅ Copy contract to contracts folder
3. ✅ Copy deployment script
4. ✅ Check/create .env file
5. ✅ Compile the contract
6. ✅ Deploy to BNB testnet

**First time running?** It will:
- Create `.env` file from template
- Open Notepad automatically
- Ask you to add your private key
- Wait for you to save and continue

---

## 🔑 Adding Your Private Key

When Notepad opens with `.env`:

1. Find this line:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

2. Get your private key from MetaMask:
   - Open MetaMask
   - Click 3 dots → Account Details
   - Click "Export Private Key"
   - Enter password
   - Copy the key (starts with 0x...)

3. Replace in .env:
   ```
   PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
   ```

4. Save (Ctrl+S) and close Notepad

5. Press any key in the Command Prompt to continue

---

## 📺 What You'll See

The deployment script will show:

```
========================================
 Blue Raffle - Automated Deployment
========================================

[Step 1/6] Checking for required files...
[OK] All required files found!

[Step 2/6] Copying contract to contracts folder...
[OK] Contract copied to contracts\BlueRaffle.sol

[Step 3/6] Copying deployment script...
[OK] Deployment script copied to scripts\deploy.js

[Step 4/6] Checking .env configuration...
[OK] .env file is configured!

[Step 5/6] Compiling contract...
Compiled 1 Solidity file successfully

[Step 6/6] Deploying to BNB Testnet...

🚀 Deploying BlueRaffle FIXED with account: 0xa757...
💰 Account balance: 0.15 BNB
📋 Deployment Parameters:
...
✅ BlueRaffle FIXED deployed to: 0xABC123...

========================================
 Deployment Complete!
========================================
```

**Copy the contract address!** You'll need it for the next steps.

---

## 🎯 After Deployment

The script will show you the next steps:

### 1. Add to VRF Subscription
- Go to: https://vrf.chain.link/bnb-chain-testnet
- Connect wallet
- Find subscription: `43371163...`
- Click "Add Consumer"
- Paste your new contract address

### 2. Update Frontend
Edit `C:\Users\bob\Blue-Raffle\frontend\src\config.js`:
```javascript
export const CONTRACT_ADDRESS = "0xYOUR_NEW_ADDRESS";
```

### 3. Test!
- Buy tickets with 2 wallets
- Wait 5 minutes
- Close round
- Verify winner is selected ✅

---

## 🐛 Troubleshooting

### "Node.js not found"
**Solution:** Install from https://nodejs.org

### "Hardhat not found"
**Solution:** Run `npm install` in your project folder

### "Insufficient funds"
**Solution:** Add more BNB to your wallet
- Faucet: https://testnet.bnbchain.org/faucet-smart

### ".env not configured"
**Solution:** Make sure you:
1. Added your actual private key (not the placeholder)
2. Private key starts with `0x`
3. No spaces or quotes around it
4. Saved the file (Ctrl+S)

### "Compilation failed"
**Solution:**
1. Make sure `BlueRaffle_FIXED.sol` is in contracts folder
2. Run `npm install` to install dependencies
3. Check for typos in contract file

### "Deployment failed"
**Common causes:**
- Wrong network in hardhat.config.js
- No BNB for gas
- Invalid private key
- RPC connection issues

---

## 📁 What the Script Does

`deploy.bat` automates these manual steps:

```cmd
# Without script (manual):
copy BlueRaffle_FIXED.sol contracts\BlueRaffle.sol
copy deploy-fixed-contract.js scripts\deploy.js
copy .env.example .env
notepad .env
npx hardhat compile
npx hardhat run scripts\deploy.js --network bsc_testnet

# With script (automatic):
deploy.bat
```

Much easier! 😎

---

## 🔄 Need to Redeploy?

Just run `deploy.bat` again! It will:
- Use your existing .env (no need to re-enter private key)
- Recompile the contract
- Deploy a fresh instance

---

## 🆘 Still Having Issues?

If the automated script doesn't work:

1. Run `check-setup.bat` to diagnose issues
2. Check the error messages carefully
3. Make sure you're in the right directory (`C:\Users\bob\Blue-Raffle`)
4. Verify your .env file is properly configured

Share any error messages and I can help debug!

---

## ✅ Success Checklist

After running `deploy.bat`:

- [ ] Contract deployed (got an address starting with 0x)
- [ ] Added contract to VRF subscription
- [ ] Updated frontend config.js
- [ ] Tested buying tickets
- [ ] Tested closing round
- [ ] Winner successfully selected

**You're done!** 🎉

---

## 💡 Pro Tips

**Tip 1:** Keep your .env file safe
- Never commit it to git
- Never share it
- It contains your private key!

**Tip 2:** Save your contract address
- The deployment creates `deployment-fixed-*.json`
- Contains all deployment info
- Useful for reference later

**Tip 3:** Test on testnet first
- Make sure everything works
- Try all features
- Then deploy to mainnet

---

Last Updated: 2025-11-21
Platform: Windows 10/11
