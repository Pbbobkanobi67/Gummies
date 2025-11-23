# ⚡ Quick Start - Blue Raffle Blockhash

Get up and running in 5 minutes!

---

## 🚀 One-Command Setup

```bash
# Install all dependencies
npm install && cd frontend && npm install && cd ..

# Copy environment template
cp .env.example .env

# Edit .env with your private key (required!)
nano .env  # or use your favorite editor
```

---

## 🔑 Configure .env

Open `.env` and add your private key:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix

# These can stay as defaults for testing:
BLUE_TOKEN=0xf11Af396703E11D48780B5154E52Fd7b430C6C01
```

**⚠️ NEVER commit your .env file!**

---

## 📦 Deploy Contract

```bash
# Compile
npm run compile

# Deploy to BSC Testnet
npm run deploy
```

Copy the deployed contract address from the output!

---

## 🎨 Start Frontend

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

---

## 🧪 Test with 2 Wallets

### Browser 1 (Normal)
1. Connect Wallet A
2. Buy 10 BLUE tickets
3. Wait...

### Browser 2 (Incognito)
1. Connect Wallet B
2. Buy 10 BLUE tickets
3. ⏰ Timer starts! (5 minutes)

### After Timer Expires
4. Either wallet: Click "Request Draw"
5. Wait ~6 seconds
6. Either wallet: Click "Execute Draw"
7. 🎉 Winner announced!
8. New round starts automatically

---

## ✅ Success Checklist

- [ ] Contract deployed
- [ ] Frontend running on localhost:3000
- [ ] Wallet connected
- [ ] On BSC Testnet
- [ ] Have BNB for gas
- [ ] Have BLUE tokens
- [ ] Ready to test!

---

## 🆘 Quick Troubleshooting

**"Wrong Network"**
→ Click "Switch Network" in the app

**"Transfer Failed"**
→ Make sure you approved BLUE token spending (app does this automatically)

**"Contract not loaded"**
→ Run `npm run deploy` again

**"Can't connect wallet"**
→ Install MetaMask or another Web3 wallet

---

## 📚 Full Documentation

- [README.md](./README.md) - Complete overview
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Test scenarios
- [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) - Full spec

---

## 🎮 Test Commands

```bash
# Compile contract
npm run compile

# Deploy to testnet
npm run deploy

# Start frontend
cd frontend && npm run dev

# Clean and rebuild
npm run clean && npm run compile
```

---

## 📊 What You Get

✅ **Smart Contract**
- Blockhash randomness (no VRF needed)
- 2-step draw (prevents manipulation)
- Auto-refund for single players
- Emergency controls

✅ **Frontend**
- Real-time countdown
- Live round updates
- Winner announcements
- Admin panel
- Clean, simple UI

✅ **Ready to Test**
- Two-wallet flow works
- All edge cases handled
- Full documentation

---

## 🎯 Next Steps

1. ✅ Deploy contract
2. ✅ Test with 2 wallets
3. ✅ Verify logic works
4. 📝 Customize styling (optional)
5. 🚀 Add features (optional)
6. 🔐 Audit for production

---

**You're ready! Start testing!** 🎰

---

**Last Updated:** 2025-11-23
