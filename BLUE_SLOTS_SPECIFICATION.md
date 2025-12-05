# Blue Slots - Game Specification

## Provably Fair Slot Machine for Blue Protocol

*BLUE Token Casino Game with gBLUE Holder Bonuses*

---

## Table of Contents

1. [Overview](#overview)
2. [Game Mechanics](#game-mechanics)
3. [Symbols & Payouts](#symbols--payouts)
4. [Bet System](#bet-system)
5. [gBLUE Holder Bonuses](#gblue-holder-bonuses)
6. [House Edge & Fund Distribution](#house-edge--fund-distribution)
7. [Randomness System](#randomness-system)
8. [Smart Contract Architecture](#smart-contract-architecture)
9. [Frontend Design](#frontend-design)
10. [Security Considerations](#security-considerations)
11. [Integration with Ecosystem](#integration-with-ecosystem)

---

## Overview

Blue Slots is a provably fair 3-reel slot machine where players bet BLUE tokens for a chance to win multiplied payouts. The game features:

- **Player-selected bet amounts** (5-100 BLUE per spin)
- **Classic 3-reel, single payline** slot mechanics
- **6 symbols** with varying rarities and payouts
- **gBLUE holder bonuses** (better odds + free spins)
- **Blockhash randomness** for provably fair outcomes
- **Flexible house edge** with configurable distribution

---

## Game Mechanics

### Basic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CONNECT    │  Player connects wallet                        │
├────────────────┼────────────────────────────────────────────────┤
│  2. SELECT BET │  Choose bet amount (5-100 BLUE)                │
├────────────────┼────────────────────────────────────────────────┤
│  3. APPROVE    │  Approve BLUE spending (one-time)              │
├────────────────┼────────────────────────────────────────────────┤
│  4. SPIN       │  Click spin, transaction submitted             │
├────────────────┼────────────────────────────────────────────────┤
│  5. WAIT       │  Wait 2 blocks for randomness                  │
├────────────────┼────────────────────────────────────────────────┤
│  6. REVEAL     │  Call reveal to see result & collect winnings  │
└────────────────┴────────────────────────────────────────────────┘
```

### Two-Step Spin Process (Provably Fair)

Similar to the raffle, we use a 2-step process to prevent manipulation:

**Step 1: Spin (Commit)**
- Player submits bet amount
- BLUE tokens transferred to contract
- Block number recorded for future randomness

**Step 2: Reveal (Execute)**
- Must wait 2+ blocks after spin
- Blockhash of target block determines outcome
- Symbols revealed, winnings paid instantly

### Reel Configuration

```
┌─────────┬─────────┬─────────┐
│  REEL 1 │  REEL 2 │  REEL 3 │
│         │         │         │
│   🔵    │   💎    │   🔵    │
│         │         │         │
└─────────┴─────────┴─────────┘
        ← PAYLINE →
```

- **3 reels**, each with the same symbol distribution
- **Single horizontal payline** (center row)
- All 3 symbols must match for jackpot payouts
- 2 matching symbols award smaller prize

---

## Symbols & Payouts

### Symbol Distribution (Per Reel)

| Symbol | Name | Count | Probability |
|--------|------|-------|-------------|
| 🔵 | BLUE | 2 | 10% |
| 💎 | Diamond | 3 | 15% |
| 🔥 | Fire | 4 | 20% |
| ⭐ | Star | 5 | 25% |
| 🍀 | Lucky | 3 | 15% |
| 🎰 | Seven | 3 | 15% |

**Total symbols per reel: 20**

### Payout Table

| Result | Description | Multiplier | Probability | House Edge Impact |
|--------|-------------|------------|-------------|-------------------|
| 🔵🔵🔵 | Triple BLUE | **50x** | 0.10% | Jackpot |
| 💎💎💎 | Triple Diamond | **25x** | 0.34% | High Win |
| 🔥🔥🔥 | Triple Fire | **10x** | 0.80% | Medium Win |
| ⭐⭐⭐ | Triple Star | **5x** | 1.56% | Low Win |
| 🍀🍀🍀 | Triple Lucky | **8x** | 0.34% | Medium Win |
| 🎰🎰🎰 | Triple Seven | **15x** | 0.34% | High Win |
| XX_ | Any 2 Match (left) | **1.5x** | ~15% | Small Win |
| _XX | Any 2 Match (right) | **1.5x** | ~15% | Small Win |
| ___ | No Match | **0x** | ~66% | Loss |

### Expected Return to Player (RTP)

```
Theoretical RTP Calculation:

Triple BLUE:    0.001 × 50 = 0.050
Triple Diamond: 0.0034 × 25 = 0.085
Triple Fire:    0.008 × 10 = 0.080
Triple Star:    0.0156 × 5 = 0.078
Triple Lucky:   0.0034 × 8 = 0.027
Triple Seven:   0.0034 × 15 = 0.051
Two Match:      0.30 × 1.5 = 0.450
                            ─────────
Base RTP:                   ~82.1%
House Edge:                 ~17.9%
```

**Note:** RTP can be adjusted by modifying symbol distribution or payouts.

---

## Bet System

### Bet Limits

| Parameter | Value | Configurable |
|-----------|-------|--------------|
| Minimum Bet | 5 BLUE | ✅ Yes (Owner) |
| Maximum Bet | 100 BLUE | ✅ Yes (Owner) |
| Bet Increment | Any amount | Fixed |

### Bet Selection UI

```
┌─────────────────────────────────────────┐
│           SELECT YOUR BET               │
│                                         │
│  [5] [10] [25] [50] [100] [CUSTOM]     │
│                                         │
│         Current Bet: 25 BLUE            │
│                                         │
│  Potential Wins:                        │
│  🔵🔵🔵 = 1,250 BLUE (50x)              │
│  💎💎💎 = 625 BLUE (25x)                │
│  🔥🔥🔥 = 250 BLUE (10x)                │
│                                         │
│         [ SPIN - 25 BLUE ]              │
└─────────────────────────────────────────┘
```

### Max Payout Cap

To protect the house bankroll:

```
Max Payout = Min(betAmount × multiplier, houseBalance × 10%)
```

If jackpot would exceed 10% of house balance, bet is rejected.

---

## gBLUE Holder Bonuses

### Tier Benefits for Slots

| Tier | gBLUE Required | RTP Boost | Free Spins/Week | Max Bet Increase |
|------|----------------|-----------|-----------------|------------------|
| 💎 Diamond | 10,000+ | +5% RTP | 10 free spins | 200 BLUE max |
| 🥇 Gold | 2,000+ | +3% RTP | 5 free spins | 150 BLUE max |
| 🥈 Silver | 500+ | +2% RTP | 2 free spins | 125 BLUE max |
| 🥉 Bronze | 100+ | +1% RTP | 1 free spin | 100 BLUE max |
| None | 0 | Base RTP | 0 | 100 BLUE max |

### RTP Boost Implementation

RTP boost is applied by improving two-match payouts:

| Tier | Two-Match Payout |
|------|------------------|
| Base | 1.5x |
| Bronze | 1.6x |
| Silver | 1.7x |
| Gold | 1.8x |
| Diamond | 2.0x |

### Free Spins

- Credited weekly (same snapshot as Holders Club)
- Use contract balance for free spin payouts
- Free spin winnings paid in full (no house cut)
- Cannot exceed max payout cap

### Free Spin Flow

```
┌─────────────────────────────────────────┐
│  🎰 FREE SPINS AVAILABLE: 5             │
│                                         │
│  [ USE FREE SPIN ]  [ BET BLUE ]        │
│                                         │
│  Free spin bet value: 25 BLUE           │
│  (Fixed amount based on tier)           │
└─────────────────────────────────────────┘
```

| Tier | Free Spin Value |
|------|-----------------|
| Diamond | 50 BLUE |
| Gold | 25 BLUE |
| Silver | 15 BLUE |
| Bronze | 10 BLUE |

---

## House Edge & Fund Distribution

### Configurable Distribution

When a player loses (or wins less than bet), funds are distributed:

| Recipient | Default % | Purpose |
|-----------|-----------|---------|
| House Reserve | 70% | Bankroll for payouts |
| Treasury | 15% | Protocol revenue |
| Burn | 10% | Deflationary |
| Jackpot Pool | 5% | Progressive jackpot (future) |

### Distribution on Wins

When player wins:
- Winnings paid from House Reserve
- If House Reserve insufficient, use Treasury as backup

### House Reserve Management

```solidity
// Minimum reserve to accept bets
minReserve = 1000 BLUE

// Max bet based on reserve
maxBetAllowed = houseReserve / maxMultiplier / 2
// Example: 50,000 reserve / 50x / 2 = 500 BLUE max bet

// Owner can deposit/withdraw from reserve
function depositToReserve(uint256 amount) external onlyOwner
function withdrawFromReserve(uint256 amount) external onlyOwner
```

---

## Randomness System

### Blockhash-Based RNG

Same proven system as BlueRaffle:

```
┌─────────────────────────────────────────────────────────────────┐
│  Block N:     Player calls spin(), bet recorded                 │
│  Block N+1:   Waiting...                                        │
│  Block N+2:   Target block (blockhash used for randomness)      │
│  Block N+3+:  Player calls reveal(), uses blockhash(N+2)        │
└─────────────────────────────────────────────────────────────────┘
```

### Random Number Generation

```solidity
function _generateSymbols(uint256 spinId) internal view returns (uint8[3] memory) {
    Spin storage spin = spins[spinId];

    uint256 targetBlock = spin.spinBlock + BLOCKS_TO_WAIT;
    bytes32 blockHash = blockhash(targetBlock);

    // Generate 3 random numbers for 3 reels
    uint256 seed = uint256(keccak256(abi.encodePacked(
        blockHash,
        spin.player,
        spin.betAmount,
        spinId
    )));

    uint8[3] memory symbols;
    symbols[0] = uint8(seed % 20);           // Reel 1: 0-19
    symbols[1] = uint8((seed >> 8) % 20);    // Reel 2: 0-19
    symbols[2] = uint8((seed >> 16) % 20);   // Reel 3: 0-19

    return symbols;
}
```

### Symbol Mapping

```solidity
function _getSymbolType(uint8 position) internal pure returns (Symbol) {
    // Distribution: BLUE(2), Diamond(3), Fire(4), Star(5), Lucky(3), Seven(3) = 20
    if (position < 2) return Symbol.BLUE;      // 0-1   (10%)
    if (position < 5) return Symbol.DIAMOND;   // 2-4   (15%)
    if (position < 9) return Symbol.FIRE;      // 5-8   (20%)
    if (position < 14) return Symbol.STAR;     // 9-13  (25%)
    if (position < 17) return Symbol.LUCKY;    // 14-16 (15%)
    return Symbol.SEVEN;                        // 17-19 (15%)
}
```

### Expiration

- Spin must be revealed within 250 blocks
- If expired, bet is refunded (minus small fee for gas)

---

## Smart Contract Architecture

### Contract Structure

```
BlueSlots.sol
├── Ownable (access control)
├── ReentrancyGuard (security)
├── Pausable (emergency)
└── GBlueHoldersClub (integration)
```

### Core Data Structures

```solidity
enum Symbol { BLUE, DIAMOND, FIRE, STAR, LUCKY, SEVEN }
enum SpinStatus { Pending, Revealed, Expired, Refunded }

struct Spin {
    address player;
    uint256 betAmount;
    uint256 spinBlock;
    uint256 winAmount;
    uint8[3] symbols;
    SpinStatus status;
    bool isFreeSpin;
}

struct PlayerStats {
    uint256 totalSpins;
    uint256 totalWagered;
    uint256 totalWon;
    uint256 biggestWin;
    uint256 freeSpinsUsed;
}
```

### Main Functions

```solidity
// Player functions
function spin(uint256 betAmount) external nonReentrant whenNotPaused returns (uint256 spinId)
function reveal(uint256 spinId) external nonReentrant returns (uint256 winAmount)
function useFreeSpin() external nonReentrant whenNotPaused returns (uint256 spinId)

// View functions
function getSpinResult(uint256 spinId) external view returns (Spin memory)
function canReveal(uint256 spinId) external view returns (bool, string memory)
function getPlayerStats(address player) external view returns (PlayerStats memory)
function calculatePayout(uint8[3] memory symbols, uint256 betAmount, address player) public view returns (uint256)

// Admin functions
function setPayoutMultipliers(...) external onlyOwner
function setBetLimits(uint256 min, uint256 max) external onlyOwner
function setDistribution(...) external onlyOwner
function depositToReserve(uint256 amount) external onlyOwner
function withdrawFromReserve(uint256 amount) external onlyOwner
function pause() external onlyOwner
function unpause() external onlyOwner
```

### Events

```solidity
event SpinStarted(uint256 indexed spinId, address indexed player, uint256 betAmount, bool isFreeSpin);
event SpinRevealed(uint256 indexed spinId, address indexed player, uint8[3] symbols, uint256 winAmount);
event SpinExpired(uint256 indexed spinId, address indexed player, uint256 refundAmount);
event JackpotWon(uint256 indexed spinId, address indexed player, Symbol symbol, uint256 amount);
event FreeSpinCredited(address indexed player, uint256 amount);
event ReserveDeposit(uint256 amount);
event ReserveWithdraw(uint256 amount);
```

---

## Frontend Design

### Main Game Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎰 BLUE SLOTS                          Balance: 1,234 BLUE        │
│                                         gBLUE Tier: 💎 Diamond     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ┌───────┬───────┬───────┐                       │
│                    │       │       │       │                       │
│                    │  🔥   │  💎   │  🔥   │  ← Previous           │
│                    │       │       │       │                       │
│                    ├───────┼───────┼───────┤                       │
│         PAYLINE →  │       │       │       │                       │
│                    │  🔵   │  🔵   │  ⭐   │  ← ACTIVE             │
│                    │       │       │       │                       │
│                    ├───────┼───────┼───────┤                       │
│                    │       │       │       │                       │
│                    │  🎰   │  🍀   │  💎   │  ← Next               │
│                    │       │       │       │                       │
│                    └───────┴───────┴───────┘                       │
│                                                                     │
│                         [ SO CLOSE! ]                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│     BET: [5] [10] [25] [50] [100]        Current: 25 BLUE          │
│                                                                     │
│     ┌─────────────────────┐    ┌─────────────────────┐             │
│     │   🎰 SPIN (25 BLUE) │    │  🎁 FREE SPIN (5)   │             │
│     └─────────────────────┘    └─────────────────────┘             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PAYOUTS          │  YOUR STATS           │  DIAMOND BONUS         │
│  🔵🔵🔵 = 50x     │  Spins: 142           │  +5% RTP               │
│  💎💎💎 = 25x     │  Wagered: 3,550 BLUE  │  2.0x on 2-match       │
│  🎰🎰🎰 = 15x     │  Won: 4,210 BLUE      │  Max bet: 200 BLUE     │
│  🔥🔥🔥 = 10x     │  Biggest: 500 BLUE    │  Free spins: 5/week    │
│  🍀🍀🍀 = 8x      │  Profit: +660 BLUE    │                        │
│  ⭐⭐⭐ = 5x      │                       │                        │
│  XX_ = 1.5x       │                       │                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Spin Animation States

```
STATE 1: IDLE
- Reels static
- SPIN button active

STATE 2: SPINNING (after spin() tx confirmed)
- Reels blur/animate
- "Waiting for randomness..." message
- Block countdown shown

STATE 3: REVEALING (after reveal() called)
- Reels stop one by one (left → right)
- 0.5s delay between each reel

STATE 4: RESULT
- Win: Flashing animation, coin sounds, win amount displayed
- Loss: Brief shake, "Try again" message
- Jackpot: Special celebration animation
```

### Mobile Responsive

```
┌─────────────────────┐
│  🎰 BLUE SLOTS      │
│  Balance: 1,234     │
├─────────────────────┤
│  ┌─────┬─────┬─────┐│
│  │ 🔵  │ 🔵  │ ⭐  ││
│  └─────┴─────┴─────┘│
│                     │
│   [ 25 BLUE ▼ ]     │
│                     │
│  ┌─────────────────┐│
│  │     SPIN        ││
│  └─────────────────┘│
│                     │
│  Free Spins: 5 🎁   │
└─────────────────────┘
```

---

## Security Considerations

### Reentrancy Protection

All state-changing functions use `nonReentrant` modifier.

### Blockhash Limitations

- Same as raffle: Validators could theoretically influence
- Mitigated by: Low max bet, 2-block delay
- Future upgrade path: Chainlink VRF

### Max Payout Protection

```solidity
require(
    potentialMaxWin <= houseReserve / 10,
    "Bet too large for current reserve"
);
```

### Overflow Protection

Solidity 0.8.20 built-in overflow checks.

### Pause Mechanism

Owner can pause in emergencies:
- Blocks new spins
- Allows reveals of pending spins
- Allows refunds of expired spins

### Audit Checklist

- [ ] Reentrancy on spin/reveal
- [ ] Integer overflow on payouts
- [ ] Blockhash manipulation window
- [ ] Reserve drainage attacks
- [ ] Free spin exploitation
- [ ] Front-running protection

---

## Integration with Ecosystem

### BlueRaffle Integration

- Same BLUE token
- Same treasury/developer wallets
- Shared pause mechanism (optional)

### gBLUE Holders Club Integration

```solidity
interface IGBlueHoldersClub {
    function getTier(address user) external view returns (uint8);
    function getFreeSpins(address user) external view returns (uint256);
    function useFreeSpins(address user, uint256 amount) external;
}
```

### Future: Progressive Jackpot

5% of losses go to jackpot pool:
- Jackpot triggers on special condition (e.g., 4th BLUE symbol via bonus)
- Or time-based jackpot lottery
- Shared across raffle + slots

### Future: Tournaments

- Weekly slot tournaments
- Entry via tickets or BLUE
- Leaderboard based on biggest multiplier win
- Prize pool from entry fees

---

## Implementation Roadmap

### Phase 1: Core Contract (Week 1)
- [ ] BlueSlots.sol contract
- [ ] Basic spin/reveal mechanics
- [ ] Payout calculations
- [ ] House reserve management

### Phase 2: Testing (Week 2)
- [ ] Unit tests (50+ tests)
- [ ] Payout math verification
- [ ] Security exploit tests
- [ ] Gas optimization

### Phase 3: Frontend (Week 3)
- [ ] React components
- [ ] Spin animations
- [ ] Sound effects
- [ ] Mobile responsive

### Phase 4: Integration (Week 4)
- [ ] gBLUE Holders Club connection
- [ ] Free spins system
- [ ] RTP boost by tier
- [ ] Shared analytics

### Phase 5: Launch
- [ ] Testnet deployment
- [ ] Community testing
- [ ] Mainnet deployment
- [ ] Marketing

---

## Configuration Summary

### Default Settings

| Parameter | Value |
|-----------|-------|
| Min Bet | 5 BLUE |
| Max Bet | 100 BLUE |
| Blocks to Wait | 2 |
| Max Block Wait | 250 |
| Base RTP | ~82% |
| House Edge | ~18% |
| House Reserve % | 70% |
| Treasury % | 15% |
| Burn % | 10% |
| Jackpot Pool % | 5% |

### Symbol Configuration

| Symbol | Count/Reel | Triple Payout |
|--------|------------|---------------|
| 🔵 BLUE | 2 | 50x |
| 💎 Diamond | 3 | 25x |
| 🔥 Fire | 4 | 10x |
| ⭐ Star | 5 | 5x |
| 🍀 Lucky | 3 | 8x |
| 🎰 Seven | 3 | 15x |

---

## Open Questions for Review

1. **RTP Target**: Is ~82% base RTP appropriate? (Typical online slots: 92-97%)
2. **Max Bet**: Should Diamond holders get 200 BLUE max or higher?
3. **Free Spin Frequency**: 10/week for Diamond too generous?
4. **Jackpot Pool**: Implement progressive jackpot in v1 or save for v2?
5. **Sound/Music**: Add audio to frontend or keep silent?
6. **Leaderboard**: Show top winners publicly?

---

## Approval Checklist

- [ ] Game mechanics approved
- [ ] Payout table approved
- [ ] gBLUE bonuses approved
- [ ] House edge distribution approved
- [ ] Frontend design approved
- [ ] Ready to build

---

*Blue Slots - Part of the Blue Protocol Casino Ecosystem*

*Provably Fair • gBLUE Holder Rewards • Cross-Chain Ready*
