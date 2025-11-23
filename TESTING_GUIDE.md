# 🧪 Two-Wallet Raffle Testing Guide

## 🎯 Objective

Test the complete raffle flow with two dummy wallets competing in 5-minute rounds.

---

## 📋 Test Scenarios

### ✅ Scenario 1: Happy Path (2 Players, Normal Win)

#### Setup:
- **Wallet A:** Player 1
- **Wallet B:** Player 2
- **Duration:** 5 minutes

#### Steps:

1. **Wallet A - Enter Raffle:**
   ```
   - Connect Wallet A
   - Buy 10 BLUE tickets
   - Status: "Waiting" (1/2 players)
   ```

2. **Wallet B - Enter Raffle:**
   ```
   - Connect Wallet B
   - Buy 15 BLUE tickets
   - Status: "Active" (2/2 players)
   - Timer starts: 5:00 countdown
   ```

3. **Wait for Timer:**
   ```
   - Watch countdown in real-time
   - Verify both wallets see same timer
   - Wait until 0:00
   ```

4. **Request Draw (Either Wallet):**
   ```
   - Click "Request Draw (Step 1)"
   - Transaction confirms
   - Status changes to "Drawing"
   - Message: "Wait 2 blocks..."
   ```

5. **Wait 2 Blocks (~6 seconds):**
   ```
   - Watch for "Ready to execute" message
   ```

6. **Execute Draw (Either Wallet):**
   ```
   - Click "Execute Draw (Step 2)"
   - Transaction confirms
   - Winner selected! 🎉
   ```

7. **Winner Announcement:**
   ```
   - Winner sees prize deposited
   - Both players see winner announcement
   - "Play Again?" prompt appears
   ```

8. **New Round Auto-Starts:**
   ```
   - Round ID increments
   - Status: "Waiting"
   - Ready for next round
   ```

**Expected Results:**
- ✅ Round completes successfully
- ✅ Winner randomly selected (weighted by tickets)
- ✅ Prize transferred correctly
- ✅ New round starts automatically

---

### ✅ Scenario 2: Single Player (Refund Test)

#### Steps:

1. **Wallet A - Enter Raffle:**
   ```
   - Connect Wallet A
   - Buy 20 BLUE tickets
   - Status: "Waiting" (1/2 players)
   ```

2. **Wait 5 Minutes:**
   ```
   - No second player joins
   - Timer doesn't start (needs 2 players)
   ```

3. **Request Draw:**
   ```
   - Click "Request Draw"
   - Automatic refund triggers
   - 20 BLUE returned to Wallet A
   ```

4. **New Round Starts:**
   ```
   - Round ID increments
   - Status: "Waiting"
   - No winner announced
   ```

**Expected Results:**
- ✅ Single player gets full refund
- ✅ No winner declared
- ✅ New round starts clean

---

### ✅ Scenario 3: Multiple Sequential Rounds

#### Steps:

1. **Round 1:**
   ```
   - Wallet A: 5 BLUE
   - Wallet B: 10 BLUE
   - Complete round
   - Winner: ???
   ```

2. **Round 2 (Immediately After):**
   ```
   - Click "Play Again"
   - Wallet A: 15 BLUE
   - Wallet B: 5 BLUE
   - Complete round
   - Winner: ???
   ```

3. **Round 3:**
   ```
   - Repeat process
   - Test continuous flow
   ```

**Expected Results:**
- ✅ Rounds cycle smoothly
- ✅ No state corruption between rounds
- ✅ Prize pool seeds correctly
- ✅ Winner changes based on odds

---

### ✅ Scenario 4: Maximum Tickets Test

#### Steps:

1. **Wallet A:**
   ```
   - Buy 150 BLUE (maximum)
   - Try to buy more → Should fail
   ```

2. **Wallet B:**
   ```
   - Buy 150 BLUE (maximum)
   - Total tickets: 300
   ```

3. **Complete Round:**
   ```
   - Request draw
   - Execute draw
   - Verify winner selection with large ticket count
   ```

**Expected Results:**
- ✅ Max limit enforced
- ✅ Large ticket counts handled correctly
- ✅ Winner selection accurate

---

### ✅ Scenario 5: Minimum Tickets Test

#### Steps:

1. **Wallet A:**
   ```
   - Try to buy 1 BLUE → Should fail
   - Try to buy 4 BLUE → Should fail
   - Buy 5 BLUE → Success!
   ```

2. **Wallet B:**
   ```
   - Buy 5 BLUE (minimum)
   - Complete round normally
   ```

**Expected Results:**
- ✅ Minimum limit enforced
- ✅ 5 BLUE minimum respected
- ✅ Round works with minimal tickets

---

### ✅ Scenario 6: Draw Timing Test

#### Steps:

1. **Setup Round:**
   ```
   - 2 players enter
   - Timer counts down
   ```

2. **Try Early Draw:**
   ```
   - Before timer expires
   - Click "Request Draw" → Should fail
   - Message: "Round still running"
   ```

3. **Wait for Timer:**
   ```
   - Timer hits 0:00
   - "Request Draw" becomes available
   ```

4. **Request Draw:**
   ```
   - Click "Request Draw"
   - Status: "Drawing"
   ```

5. **Try Immediate Execute:**
   ```
   - Click "Execute Draw" immediately
   - Should fail or show "Wait X blocks"
   ```

6. **Wait 2 Blocks:**
   ```
   - Message changes to "Ready to execute"
   - Execute draw succeeds
   ```

**Expected Results:**
- ✅ Can't draw before timer expires
- ✅ Must wait 2 blocks after request
- ✅ Draw executes successfully after waiting

---

### ✅ Scenario 7: Draw Expiration Test

#### Steps:

1. **Request Draw:**
   ```
   - Request draw normally
   - Don't execute immediately
   ```

2. **Wait 250+ Blocks (~12.5 minutes):**
   ```
   - Let draw request expire
   ```

3. **Try to Execute:**
   ```
   - Click "Execute Draw"
   - Should fail: "Draw expired"
   ```

4. **Request Again:**
   ```
   - Click "Request Draw" again
   - Execute within time limit
   - Should succeed
   ```

**Expected Results:**
- ✅ Expired draws handled correctly
- ✅ Can request new draw after expiration
- ✅ Blockhash protection works

---

### ✅ Scenario 8: Admin Controls Test

#### Steps:

1. **Connect Owner Wallet:**
   ```
   - Admin panel appears
   ```

2. **Pause Contract:**
   ```
   - Click "Pause Contract"
   - Try to buy tickets → Should fail
   ```

3. **Unpause Contract:**
   ```
   - Click "Unpause Contract"
   - Tickets purchasable again
   ```

4. **Set Bonus Multiplier:**
   ```
   - Set to 2x
   - Buy 10 BLUE
   - Receive 20 tickets
   ```

5. **Cancel Round:**
   ```
   - 2 players in active round
   - Click "Cancel Round"
   - Both players refunded
   - New round starts
   ```

**Expected Results:**
- ✅ Pause stops all purchases
- ✅ Bonus multiplier works correctly
- ✅ Cancel refunds all participants

---

## 📊 Testing Checklist

### Core Functionality:
- [ ] Two players can enter raffle
- [ ] Timer starts when 2nd player joins
- [ ] Timer counts down correctly
- [ ] Round can be drawn after timer expires
- [ ] 2-step draw process works (request → execute)
- [ ] Winner selected randomly (weighted)
- [ ] Winner receives prize
- [ ] Loser doesn't receive prize
- [ ] New round auto-starts

### Edge Cases:
- [ ] Single player gets refunded
- [ ] Minimum ticket amount enforced (5 BLUE)
- [ ] Maximum ticket amount enforced (150 BLUE)
- [ ] Can't draw before timer expires
- [ ] Must wait 2 blocks between request/execute
- [ ] Draw expires after 250 blocks
- [ ] Multiple sequential rounds work

### Admin Functions:
- [ ] Pause stops purchases
- [ ] Unpause resumes purchases
- [ ] Bonus multiplier changes ticket ratio
- [ ] Cancel round refunds participants
- [ ] Non-owner can't access admin functions

### UI/UX:
- [ ] Timer updates in real-time
- [ ] Round status displays correctly
- [ ] Winner announcement shows
- [ ] "Play Again" prompt works
- [ ] Error messages display
- [ ] Loading states show
- [ ] Both wallets see same data

---

## 🐛 Common Issues & Solutions

### Issue: "Transfer Failed"

**Cause:** BLUE token not approved

**Solution:**
```javascript
// Approve BLUE token first
const blueToken = new ethers.Contract(blueTokenAddress, ERC20_ABI, signer);
await blueToken.approve(raffleAddress, ethers.parseEther("1000"));
```

### Issue: Timer Doesn't Start

**Cause:** Need 2 players minimum

**Solution:** Connect second wallet and buy tickets

### Issue: Can't Execute Draw

**Cause:** Haven't waited 2 blocks

**Solution:** Wait 6-10 seconds after requesting

### Issue: Winner Not Displayed

**Cause:** Frontend not refreshing

**Solution:** Refresh page or check contract directly

---

## 📈 Success Metrics

A successful test should demonstrate:

1. **100% Success Rate** on happy path
2. **Proper Error Handling** for edge cases
3. **Accurate Prize Distribution**
4. **Fair Random Selection** (test multiple rounds)
5. **No State Corruption** between rounds
6. **Gas Efficiency** (reasonable costs)

---

## 🎬 Quick Test Script

For rapid testing:

```bash
# Terminal 1: Start frontend
cd frontend && npm run dev

# Terminal 2: Watch contract events
npx hardhat run scripts/watch-events.js

# Browser 1: Wallet A (localhost:3000)
# Browser 2: Wallet B (localhost:3000 in incognito)
```

**Run through Scenario 1 (Happy Path) first, then test edge cases.**

---

## ✅ Test Complete!

Once all scenarios pass:
- ✅ Logic is 100% correct
- ✅ Ready for styling improvements
- ✅ Ready for additional features
- ✅ Ready for audit/production

---

**Last Updated:** 2025-11-23
