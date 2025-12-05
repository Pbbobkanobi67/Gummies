# gBLUE Holders Club

## Cross-Chain Rewards System for Blue Protocol Ecosystem

**Incentivizing gBLUE Holders with Casino Ticket Rewards**

*Across BSC • Abstract (Arborean DEX)*

---

## The Core Idea

Instead of just using BLUE tokens to buy raffle tickets, **gBLUE holders get rewarded simply for holding**. The more gBLUE you hold across any chain, the more free tickets and bonuses you get.

```
Hold gBLUE → Get assigned a Tier → Receive weekly benefits
```

**Every week:**
1. We snapshot gBLUE balances on BSC and Abstract (including Arborean DEX LPs)
2. Add up each wallet's total across all chains
3. Assign tier based on total holdings
4. Users claim free tickets + get multiplier on purchases

---

## Executive Summary

This proposal outlines a comprehensive rewards system that incentivizes gBLUE token holders with BlueRaffle casino tickets. With gBLUE now available cross-chain on Abstract blockchain and Arborean DEX, we have a unique opportunity to create a unified ecosystem that rewards holders across all chains.

### The Opportunity

The cross-chain expansion of gBLUE creates three key opportunities:

- ✅ Reward long-term holders and reduce sell pressure
- ✅ Drive liquidity to Arborean DEX through LP incentives
- ✅ Increase raffle participation and prize pools
- ✅ Create network effects across BSC, Abstract, and Arborean

### Key Stats

| Metric | Value |
|--------|-------|
| Reward Tiers | 4 |
| Max Free Tickets/Week | 100 |
| Max Purchase Multiplier | 2x |
| Chains Supported | 2 (BSC + Abstract) |

---

## Tier System

The gBLUE Holders Club features four tiers based on total gBLUE holdings across all supported chains. Holdings are aggregated weekly via snapshot.

| Tier | Min Holding | Free Tickets/Week | Purchase Multiplier |
|------|-------------|-------------------|---------------------|
| 💎 **DIAMOND** | 10,000+ gBLUE | 100 tickets | 2.0x |
| 🥇 **GOLD** | 2,000+ gBLUE | 30 tickets | 1.5x |
| 🥈 **SILVER** | 500+ gBLUE | 10 tickets | 1.25x |
| 🥉 **BRONZE** | 100+ gBLUE | 2 tickets | 1.1x |

### Real Example: Diamond Holder

```
Diamond Holder (12,000 gBLUE):

Weekly free tickets:           100 tickets
Buys 50 BLUE of tickets:       100 tickets (50 × 2x multiplier)
                               ───────────
Total entries this week:       200 tickets

Without Diamond status, 50 BLUE = only 50 tickets
Diamond gets 4x more entries for same spend!
```

### How Tiers Work

1. **Weekly snapshot** captures gBLUE balances on BSC and Abstract (including Arborean DEX LPs)
2. **Balances are aggregated** (500 BSC + 500 Abstract = 1,000 total = Gold tier)
3. **Tier benefits activate** immediately after snapshot
4. **Free tickets** can be claimed once per week
5. **Multiplier applies** to all ticket purchases until next snapshot

### Example Scenarios

**Scenario A: Diamond Holder**
```
Holds 12,000 gBLUE across chains → Receives 100 free tickets/week
Buys 50 BLUE worth of tickets → Gets 100 tickets (2x multiplier)
Total weekly tickets: 200 (worth ~212 BLUE in entries)
```

**Scenario B: Silver Holder + LP Provider**
```
Holds 600 gBLUE + Provides LP on Arborean → Silver + LP Bonus
Receives 10 free tickets + 50% LP bonus = 15 tickets/week
1.25x multiplier + LP benefits create strong incentive to hold & provide liquidity
```

---

## LP Incentives

To encourage liquidity provision on Arborean DEX, LP providers receive bonus ticket rewards on top of their holder tier benefits.

### Arborean DEX LP Rewards

| Liquidity Pool | Ticket Bonus | Benefit |
|----------------|--------------|---------|
| **gBLUE / ETH** | +100% | Double your weekly free tickets |
| **gBLUE / BLUE** | +75% | 1.75x your weekly free tickets |
| **gBLUE / USDC** | +50% | 1.5x your weekly free tickets |

### Why LP Incentives Matter

- 📈 Deeper liquidity = Better price stability for gBLUE
- 💱 Reduced slippage encourages larger trades
- 🎁 LPs are rewarded for providing ecosystem value
- 🔄 Creates positive flywheel: LP → Win → Buy gBLUE → LP more

### LP Bonus Calculation

LP bonuses stack with holder tier benefits:

```
Gold Tier (2,000 gBLUE)     = 30 tickets/week
+ gBLUE/ETH LP Bonus (100%) = 30 bonus tickets
─────────────────────────────────────────────
Total Weekly Tickets        = 60 tickets/week
```

---

## Cross-Chain Magic

Your gBLUE counts **everywhere** - you don't need to move tokens around. Hold wherever you want:

```
BSC wallet:                 500 gBLUE
Abstract wallet:            300 gBLUE
Arborean DEX LP (Abstract): 200 gBLUE (in liquidity pool)
                            ─────────
Total:                    1,000 gBLUE → 🥇 GOLD TIER
```

This is powerful because:
- No bridging required to qualify for tiers
- LP positions on Arborean DEX count toward your total
- Flexibility to use gBLUE wherever makes sense for you

---

## Cross-Chain Architecture

The gBLUE Holders Club aggregates holdings across both chains to determine tier eligibility.

### Supported Chains

| Chain | Role | Features |
|-------|------|----------|
| **BSC** | Primary Chain | Raffle Contract, Ticket Claims, Prize Distribution |
| **Abstract** | Consumer L2 | gBLUE Holdings, Arborean DEX, LP Positions, Low Gas |

**Arborean DEX** is the decentralized exchange on Abstract blockchain where gBLUE can be traded and liquidity provided.

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. SNAPSHOT: Capture gBLUE balances on BSC + Abstract (weekly)      │
│                                                                       │
│  2. AGGREGATE: Sum holdings per wallet address                        │
│     └── BSC: 1,000 + Abstract wallet: 500 + Arborean LP: 500 = 2,000 │
│                                                                       │
│  3. CALCULATE: Determine tier + LP bonuses                            │
│     └── 2,000 gBLUE = Gold (30 tickets) + LP (+22 bonus)             │
│                                                                       │
│  4. MERKLE ROOT: Generate proof for all eligible wallets              │
│                                                                       │
│  5. CLAIM: Users claim tickets on BSC with Merkle proof               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Smart Contract: GBlueHoldersClub.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GBlueHoldersClub {

    struct Tier {
        uint256 minHolding;      // Minimum gBLUE required
        uint256 weeklyTickets;   // Free tickets per week
        uint256 multiplierBps;   // Purchase multiplier (10000 = 1x)
    }

    // Tier definitions
    Tier public diamond = Tier(10000e18, 100, 20000);  // 2x
    Tier public gold    = Tier(2000e18,  30,  15000);  // 1.5x
    Tier public silver  = Tier(500e18,   10,  12500);  // 1.25x
    Tier public bronze  = Tier(100e18,   2,   11000);  // 1.1x

    // Merkle root for cross-chain balance verification
    bytes32 public merkleRoot;
    mapping(address => uint256) public lastClaimWeek;

    function claimWeeklyTickets(
        uint256 totalBalance,
        uint256 lpBonus,
        bytes32[] calldata proof
    ) external {
        // Verify Merkle proof
        // Calculate tier based on totalBalance
        // Apply LP bonus
        // Credit tickets to user
    }

    function getMultiplier(address user) external view returns (uint256);
}
```

### Integration with BlueRaffle

The existing BlueRaffle contract will be updated to:
- Query GBlueHoldersClub for user multiplier before ticket purchase
- Apply multiplier to tickets received (e.g., 10 BLUE × 1.5x = 15 tickets)
- Emit events for tracking multiplied purchases

---

## Why This Is Powerful

### For Holders

| Benefit | Description |
|---------|-------------|
| 🎁 **Passive Income** | Tickets = chance to win prizes, just for holding |
| 🔓 **No Lock Required** | No staking or locking - your gBLUE stays liquid |
| 🔄 **Compounding Rewards** | Win → buy more gBLUE → higher tier → more wins |
| 🌐 **Chain Flexibility** | Hold on any supported chain, it all counts |

### For Blue Protocol

| Benefit | Description |
|---------|-------------|
| 📉 **Reduced Sell Pressure** | Why sell when holding = rewards? |
| 💧 **Deeper Liquidity** | LP incentives drive Arborean DEX growth |
| 👥 **Sticky Community** | Engaged holders become long-term supporters |
| 📈 **Sustainable Tokenomics** | Utility creates organic demand |

### For the Raffle

| Benefit | Description |
|---------|-------------|
| 🎰 **More Participants** | Bigger prize pools from increased entries |
| 🔥 **More Engagement** | Free tickets bring people back weekly |
| 📢 **Viral Growth** | Winners tell friends, network effects kick in |

---

## The Weekly Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  MONDAY     │  Snapshot taken on BSC + Abstract             │
├─────────────┼───────────────────────────────────────────────┤
│  TUESDAY    │  Merkle root published on-chain               │
├─────────────┼───────────────────────────────────────────────┤
│  ALL WEEK   │  Users claim free tickets                     │
│             │  Multiplier active on all purchases           │
├─────────────┼───────────────────────────────────────────────┤
│  SUNDAY     │  Cycle resets, prepare for next snapshot      │
└─────────────┴───────────────────────────────────────────────┘
```

**Claim anytime during the week** - no rush, no gas wars. Your tickets are reserved once the snapshot is taken.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- 🔨 Build cross-chain snapshot aggregator
- 🔨 Deploy GBlueHoldersClub contract on BSC testnet
- 🔨 Implement Merkle tree generation for weekly snapshots
- 🔨 Create admin dashboard for snapshot management
- 🔨 Internal testing with test wallets

### Phase 2: Integration (Week 3)
- 🔧 Update BlueRaffle contract to support multipliers
- 🔧 Build ticket claim UI in frontend
- 🔧 Integrate LP position detection for Arborean DEX
- 🔧 Security review and testing

### Phase 3: Launch (Week 4)
- 🚀 Deploy to BSC mainnet
- 🚀 First weekly snapshot and Merkle root publication
- 🚀 Community announcement and documentation
- 🚀 Monitor and optimize gas costs

### Phase 4: Expansion (Future)
- 🌐 Real-time cross-chain oracle integration (LayerZero/CCIP)
- 🌐 Native raffle entries from Abstract chain
- 🌐 Additional LP pool incentives
- 🌐 Governance voting for tier parameters

---

## Benefits Analysis

### For gBLUE Holders

| Passive Rewards | Increased Value |
|-----------------|-----------------|
| Earn tickets just by holding | gBLUE becomes yield-bearing |
| No staking or locking required | Reduced sell pressure |
| Cross-chain flexibility | Community engagement |
| Multiplied winning chances | Exclusive Diamond benefits |
| LP bonuses stack with tiers | Long-term holder rewards |

### For Blue Protocol

| Ecosystem Growth | Raffle Benefits |
|------------------|-----------------|
| Increased token utility | Higher participation rates |
| Deeper DEX liquidity | Larger prize pools |
| Cross-chain presence | More frequent rounds |
| Community loyalty | Engaged user base |
| Sustainable tokenomics | Viral growth potential |

### Projected Impact

| Metric | Expected Increase |
|--------|-------------------|
| Holder Retention | +40% |
| Raffle Participation | +60% |
| DEX Liquidity | +80% |
| Community Growth | 3x |

---

## Next Steps

### Immediate Actions

1. **Review & Approve Tier Structure**
   - Confirm tier thresholds, ticket allocations, and multipliers

2. **Provide Chain Integration Details**
   - gBLUE contract addresses on Abstract and Arborean DEX

3. **Confirm LP Pool Priorities**
   - Which pools should receive highest incentives?

4. **Kick Off Development**
   - Begin Phase 1 implementation upon approval

### Questions for Blue Protocol Team

- What are the gBLUE contract addresses on Abstract and Arborean?
- Are there specific LP pools you want to prioritize?
- Should Diamond tier have additional exclusive benefits?
- What is the preferred launch timeline?
- Any concerns about the tier thresholds or multipliers?

---

## Ready to Build the Future of gBLUE Rewards

This proposal represents a significant opportunity to add utility to gBLUE while driving engagement across the entire Blue Protocol ecosystem.

---

*BlueRaffle × Blue Protocol*

*BSC • Abstract (Arborean DEX)*
