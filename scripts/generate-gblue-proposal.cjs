const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  margin: 50,
  size: 'A4'
});
const outputPath = './gBLUE_Holders_Club_Proposal.pdf';
doc.pipe(fs.createWriteStream(outputPath));

// Color palette
const colors = {
  primary: '#1a56db',      // Blue
  secondary: '#7c3aed',    // Purple
  accent: '#059669',       // Green
  gold: '#d97706',         // Gold
  dark: '#1f2937',         // Dark gray
  medium: '#4b5563',       // Medium gray
  light: '#9ca3af',        // Light gray
  background: '#f3f4f6',   // Light background
  white: '#ffffff'
};

// Helper functions
const pageTitle = (text) => {
  doc.fontSize(28).font('Helvetica-Bold').fillColor(colors.primary).text(text);
  doc.moveDown(0.3);
  doc.strokeColor(colors.secondary).lineWidth(3)
    .moveTo(50, doc.y).lineTo(200, doc.y).stroke();
  doc.moveDown(1);
};

const sectionTitle = (text) => {
  doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.primary).text(text);
  doc.moveDown(0.4);
};

const subsection = (text) => {
  doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.secondary).text(text);
  doc.moveDown(0.3);
};

const body = (text) => {
  doc.fontSize(11).font('Helvetica').fillColor(colors.dark).text(text, { lineGap: 3 });
  doc.moveDown(0.4);
};

const bullet = (text, indent = 0) => {
  const x = 50 + (indent * 20);
  doc.fontSize(11).font('Helvetica').fillColor(colors.medium)
    .text(`●  ${text}`, x, doc.y, { indent: 15 });
};

const numberPoint = (num, text) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary)
    .text(`${num}.`, 50, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(colors.dark).text(`  ${text}`);
};

const highlight = (text) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.accent).text(text);
};

const statBox = (label, value, x, y, width) => {
  doc.rect(x, y, width, 60).fill(colors.background);
  doc.fontSize(24).font('Helvetica-Bold').fillColor(colors.primary)
    .text(value, x, y + 10, { width: width, align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor(colors.medium)
    .text(label, x, y + 40, { width: width, align: 'center' });
};

const tierRow = (tier, holding, tickets, multiplier, color, y) => {
  doc.rect(50, y, 495, 35).fill(color);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.white)
    .text(tier, 60, y + 12);
  doc.font('Helvetica').fillColor(colors.white)
    .text(holding, 160, y + 12)
    .text(tickets, 300, y + 12)
    .text(multiplier, 420, y + 12);
};

// ============ COVER PAGE ============
doc.rect(0, 0, 612, 842).fill(colors.primary);

doc.fontSize(42).font('Helvetica-Bold').fillColor(colors.white)
  .text('gBLUE', 50, 200, { align: 'center' });
doc.fontSize(36).font('Helvetica-Bold').fillColor(colors.white)
  .text('Holders Club', 50, 250, { align: 'center' });

doc.moveDown(2);
doc.fontSize(18).font('Helvetica').fillColor('#93c5fd')
  .text('Cross-Chain Rewards System', 50, 320, { align: 'center' });
doc.text('for Blue Protocol Ecosystem', 50, 345, { align: 'center' });

doc.moveDown(4);
doc.fontSize(14).font('Helvetica').fillColor(colors.white)
  .text('Incentivizing gBLUE Holders with Casino Ticket Rewards', 50, 450, { align: 'center' });
doc.text('Across BSC • Abstract • Arborean DEX', 50, 475, { align: 'center' });

doc.fontSize(12).fillColor('#93c5fd')
  .text('Proposal Document', 50, 700, { align: 'center' });
doc.text(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 720, { align: 'center' });

// ============ PAGE 2: EXECUTIVE SUMMARY ============
doc.addPage();
pageTitle('Executive Summary');

body('This proposal outlines a comprehensive rewards system that incentivizes gBLUE token holders with BlueRaffle casino tickets. With gBLUE now available cross-chain on Abstract blockchain and Arborean DEX, we have a unique opportunity to create a unified ecosystem that rewards holders across all chains.');

doc.moveDown(0.5);
sectionTitle('The Opportunity');

body('The cross-chain expansion of gBLUE creates three key opportunities:');
doc.moveDown(0.3);
bullet('Reward long-term holders and reduce sell pressure');
bullet('Drive liquidity to Arborean DEX through LP incentives');
bullet('Increase raffle participation and prize pools');
bullet('Create network effects across BSC, Abstract, and Arborean');

doc.moveDown(0.8);
sectionTitle('Proposed Solution: gBLUE Holders Club');

body('A tiered membership system that rewards gBLUE holders with:');
doc.moveDown(0.3);
bullet('Free weekly raffle tickets based on holdings');
bullet('Purchase multipliers when buying additional tickets');
bullet('Bonus rewards for providing LP on Arborean DEX');
bullet('Cross-chain balance aggregation for tier qualification');

doc.moveDown(0.8);
sectionTitle('Key Benefits');

const benefitY = doc.y + 10;
statBox('4', 'Reward Tiers', 50, benefitY, 115);
statBox('100', 'Max Free Tickets/Week', 175, benefitY, 115);
statBox('2x', 'Max Multiplier', 300, benefitY, 115);
statBox('3', 'Chains Supported', 425, benefitY, 115);

// ============ PAGE 3: TIER SYSTEM ============
doc.addPage();
pageTitle('Tier System');

body('The gBLUE Holders Club features four tiers based on total gBLUE holdings across all supported chains. Holdings are aggregated weekly via snapshot.');

doc.moveDown(0.5);

// Table header
doc.rect(50, doc.y, 495, 30).fill(colors.dark);
doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.white)
  .text('TIER', 60, doc.y - 22)
  .text('MIN HOLDING', 160, doc.y - 22)
  .text('FREE TICKETS/WEEK', 280, doc.y - 22)
  .text('MULTIPLIER', 420, doc.y - 22);

let tableY = doc.y + 8;
tierRow('DIAMOND', '10,000+ gBLUE', '100 tickets', '2.0x', '#7c3aed', tableY);
tierRow('GOLD', '2,000+ gBLUE', '30 tickets', '1.5x', colors.gold, tableY + 35);
tierRow('SILVER', '500+ gBLUE', '10 tickets', '1.25x', '#6b7280', tableY + 70);
tierRow('BRONZE', '100+ gBLUE', '2 tickets', '1.1x', '#92400e', tableY + 105);

doc.y = tableY + 160;
doc.moveDown(1);

sectionTitle('How Tiers Work');

numberPoint('1', 'Weekly snapshot captures gBLUE balances on BSC, Abstract, and Arborean DEX');
doc.moveDown(0.2);
numberPoint('2', 'Balances are aggregated (500 BSC + 500 Abstract = 1,000 total = Gold tier)');
doc.moveDown(0.2);
numberPoint('3', 'Tier benefits activate immediately after snapshot');
doc.moveDown(0.2);
numberPoint('4', 'Free tickets can be claimed once per week');
doc.moveDown(0.2);
numberPoint('5', 'Multiplier applies to all ticket purchases until next snapshot');

doc.moveDown(1);
sectionTitle('Example Scenarios');

doc.rect(50, doc.y, 495, 80).fill(colors.background);
doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Scenario A: Diamond Holder', 60, doc.y + 10);
doc.font('Helvetica').fillColor(colors.dark)
  .text('Holds 12,000 gBLUE across chains → Receives 100 free tickets/week', 60, doc.y + 25)
  .text('Buys 50 BLUE worth of tickets → Gets 100 tickets (2x multiplier)', 60, doc.y + 40)
  .text('Total weekly tickets: 200 (worth ~212 BLUE in entries)', 60, doc.y + 55);

doc.y += 90;
doc.rect(50, doc.y, 495, 80).fill(colors.background);
doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Scenario B: Silver Holder + LP Provider', 60, doc.y + 10);
doc.font('Helvetica').fillColor(colors.dark)
  .text('Holds 600 gBLUE + Provides LP on Arborean → Silver + LP Bonus', 60, doc.y + 25)
  .text('Receives 10 free tickets + 50% LP bonus = 15 tickets/week', 60, doc.y + 40)
  .text('1.25x multiplier + LP benefits create strong incentive to hold & provide liquidity', 60, doc.y + 55);

// ============ PAGE 4: LP INCENTIVES ============
doc.addPage();
pageTitle('LP Incentives');

body('To encourage liquidity provision on Arborean DEX, LP providers receive bonus ticket rewards on top of their holder tier benefits.');

doc.moveDown(0.5);
sectionTitle('Arborean DEX LP Rewards');

// LP Table
doc.rect(50, doc.y, 495, 30).fill(colors.secondary);
doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.white)
  .text('LIQUIDITY POOL', 60, doc.y + 10)
  .text('TICKET BONUS', 200, doc.y + 10)
  .text('BENEFIT', 350, doc.y + 10);

let lpY = doc.y + 38;
doc.rect(50, lpY, 495, 35).fill('#f3e8ff');
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.secondary)
  .text('gBLUE / ETH', 60, lpY + 12);
doc.font('Helvetica').fillColor(colors.dark)
  .text('+100% ticket bonus', 200, lpY + 12)
  .text('Double your weekly free tickets', 350, lpY + 12);

doc.rect(50, lpY + 35, 495, 35).fill('#ede9fe');
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.secondary)
  .text('gBLUE / USDC', 60, lpY + 47);
doc.font('Helvetica').fillColor(colors.dark)
  .text('+50% ticket bonus', 200, lpY + 47)
  .text('1.5x your weekly free tickets', 350, lpY + 47);

doc.rect(50, lpY + 70, 495, 35).fill('#f3e8ff');
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.secondary)
  .text('gBLUE / BLUE', 60, lpY + 82);
doc.font('Helvetica').fillColor(colors.dark)
  .text('+75% ticket bonus', 200, lpY + 82)
  .text('1.75x your weekly free tickets', 350, lpY + 82);

doc.y = lpY + 130;
doc.moveDown(1);

sectionTitle('Why LP Incentives Matter');

bullet('Deeper liquidity = Better price stability for gBLUE');
bullet('Reduced slippage encourages larger trades');
bullet('LPs are rewarded for providing ecosystem value');
bullet('Creates positive flywheel: LP → Win → Buy gBLUE → LP more');

doc.moveDown(1);
sectionTitle('LP Bonus Calculation');

body('LP bonuses stack with holder tier benefits:');
doc.moveDown(0.3);

doc.rect(50, doc.y, 495, 70).fill(colors.background);
doc.fontSize(10).font('Courier').fillColor(colors.dark)
  .text('Gold Tier (2,000 gBLUE)     = 30 tickets/week', 70, doc.y + 15)
  .text('+ gBLUE/ETH LP Bonus (100%) = 30 bonus tickets', 70, doc.y + 30)
  .text('─────────────────────────────────────────────', 70, doc.y + 42)
  .text('Total Weekly Tickets        = 60 tickets/week', 70, doc.y + 55);

// ============ PAGE 5: CROSS-CHAIN ARCHITECTURE ============
doc.addPage();
pageTitle('Cross-Chain Architecture');

body('The gBLUE Holders Club aggregates holdings across three chains to determine tier eligibility. This creates a unified experience regardless of where users hold their gBLUE.');

doc.moveDown(0.5);
sectionTitle('Supported Chains');

const chainY = doc.y + 10;

// BSC Box
doc.rect(50, chainY, 150, 100).fill('#f0b90b').stroke();
doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.white)
  .text('BSC', 50, chainY + 15, { width: 150, align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor(colors.white)
  .text('Primary Chain', 50, chainY + 35, { width: 150, align: 'center' })
  .text('• Raffle Contract', 60, chainY + 55)
  .text('• Ticket Claims', 60, chainY + 70)
  .text('• Prize Distribution', 60, chainY + 85);

// Abstract Box
doc.rect(220, chainY, 150, 100).fill('#6366f1').stroke();
doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.white)
  .text('Abstract', 220, chainY + 15, { width: 150, align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor(colors.white)
  .text('Consumer L2', 220, chainY + 35, { width: 150, align: 'center' })
  .text('• gBLUE Holdings', 230, chainY + 55)
  .text('• Future Expansion', 230, chainY + 70)
  .text('• Low Gas Entries', 230, chainY + 85);

// Arborean Box
doc.rect(390, chainY, 150, 100).fill('#059669').stroke();
doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.white)
  .text('Arborean', 390, chainY + 15, { width: 150, align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor(colors.white)
  .text('DEX Platform', 390, chainY + 35, { width: 150, align: 'center' })
  .text('• LP Positions', 400, chainY + 55)
  .text('• gBLUE Trading', 400, chainY + 70)
  .text('• LP Rewards', 400, chainY + 85);

doc.y = chainY + 130;
doc.moveDown(1);

sectionTitle('Data Flow');

body('Weekly process for determining rewards:');
doc.moveDown(0.3);

doc.fontSize(10).font('Courier').fillColor(colors.dark);
doc.text('┌─────────────────────────────────────────────────────────────────┐', 50);
doc.text('│  1. SNAPSHOT: Capture gBLUE balances on all chains (weekly)    │', 50);
doc.text('│                                                                 │', 50);
doc.text('│  2. AGGREGATE: Sum holdings per wallet address                 │', 50);
doc.text('│     └── BSC: 1,000 + Abstract: 500 + Arborean LP: 500 = 2,000 │', 50);
doc.text('│                                                                 │', 50);
doc.text('│  3. CALCULATE: Determine tier + LP bonuses                     │', 50);
doc.text('│     └── 2,000 gBLUE = Gold (30 tickets) + LP (+22 bonus)      │', 50);
doc.text('│                                                                 │', 50);
doc.text('│  4. MERKLE ROOT: Generate proof for all eligible wallets       │', 50);
doc.text('│                                                                 │', 50);
doc.text('│  5. CLAIM: Users claim tickets on BSC with Merkle proof        │', 50);
doc.text('└─────────────────────────────────────────────────────────────────┘', 50);

// ============ PAGE 6: TECHNICAL IMPLEMENTATION ============
doc.addPage();
pageTitle('Technical Implementation');

sectionTitle('Smart Contract: GBlueHoldersClub.sol');

doc.fontSize(9).font('Courier').fillColor(colors.dark);
doc.text('// SPDX-License-Identifier: MIT', 50);
doc.text('pragma solidity ^0.8.20;', 50);
doc.text('', 50);
doc.text('contract GBlueHoldersClub {', 50);
doc.text('', 50);
doc.text('    struct Tier {', 50);
doc.text('        uint256 minHolding;      // Minimum gBLUE required', 50);
doc.text('        uint256 weeklyTickets;   // Free tickets per week', 50);
doc.text('        uint256 multiplierBps;   // Purchase multiplier (10000 = 1x)', 50);
doc.text('    }', 50);
doc.text('', 50);
doc.text('    // Tier definitions', 50);
doc.text('    Tier public diamond = Tier(10000e18, 100, 20000);  // 2x', 50);
doc.text('    Tier public gold    = Tier(2000e18,  30,  15000);  // 1.5x', 50);
doc.text('    Tier public silver  = Tier(500e18,   10,  12500);  // 1.25x', 50);
doc.text('    Tier public bronze  = Tier(100e18,   2,   11000);  // 1.1x', 50);
doc.text('', 50);
doc.text('    // Merkle root for cross-chain balance verification', 50);
doc.text('    bytes32 public merkleRoot;', 50);
doc.text('    mapping(address => uint256) public lastClaimWeek;', 50);
doc.text('', 50);
doc.text('    function claimWeeklyTickets(', 50);
doc.text('        uint256 totalBalance,', 50);
doc.text('        uint256 lpBonus,', 50);
doc.text('        bytes32[] calldata proof', 50);
doc.text('    ) external {', 50);
doc.text('        // Verify Merkle proof', 50);
doc.text('        // Calculate tier based on totalBalance', 50);
doc.text('        // Apply LP bonus', 50);
doc.text('        // Credit tickets to user', 50);
doc.text('    }', 50);
doc.text('', 50);
doc.text('    function getMultiplier(address user) external view returns (uint256);', 50);
doc.text('}', 50);

doc.moveDown(1);
sectionTitle('Integration with BlueRaffle');

body('The existing BlueRaffle contract will be updated to:');
doc.moveDown(0.2);
bullet('Query GBlueHoldersClub for user multiplier before ticket purchase');
bullet('Apply multiplier to tickets received (e.g., 10 BLUE × 1.5x = 15 tickets)');
bullet('Emit events for tracking multiplied purchases');

// ============ PAGE 7: IMPLEMENTATION ROADMAP ============
doc.addPage();
pageTitle('Implementation Roadmap');

sectionTitle('Phase 1: Foundation (Week 1-2)');
doc.rect(50, doc.y, 10, 80).fill(colors.accent);
doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
doc.text('• Build cross-chain snapshot aggregator', 70, doc.y + 5);
doc.text('• Deploy GBlueHoldersClub contract on BSC testnet', 70, doc.y + 20);
doc.text('• Implement Merkle tree generation for weekly snapshots', 70, doc.y + 35);
doc.text('• Create admin dashboard for snapshot management', 70, doc.y + 50);
doc.text('• Internal testing with test wallets', 70, doc.y + 65);

doc.y += 100;
sectionTitle('Phase 2: Integration (Week 3)');
doc.rect(50, doc.y, 10, 65).fill(colors.primary);
doc.text('• Update BlueRaffle contract to support multipliers', 70, doc.y + 5);
doc.text('• Build ticket claim UI in frontend', 70, doc.y + 20);
doc.text('• Integrate LP position detection for Arborean DEX', 70, doc.y + 35);
doc.text('• Security review and testing', 70, doc.y + 50);

doc.y += 85;
sectionTitle('Phase 3: Launch (Week 4)');
doc.rect(50, doc.y, 10, 65).fill(colors.secondary);
doc.text('• Deploy to BSC mainnet', 70, doc.y + 5);
doc.text('• First weekly snapshot and Merkle root publication', 70, doc.y + 20);
doc.text('• Community announcement and documentation', 70, doc.y + 35);
doc.text('• Monitor and optimize gas costs', 70, doc.y + 50);

doc.y += 85;
sectionTitle('Phase 4: Expansion (Future)');
doc.rect(50, doc.y, 10, 65).fill(colors.gold);
doc.text('• Real-time cross-chain oracle integration (LayerZero/CCIP)', 70, doc.y + 5);
doc.text('• Native raffle entries from Abstract chain', 70, doc.y + 20);
doc.text('• Additional LP pool incentives', 70, doc.y + 35);
doc.text('• Governance voting for tier parameters', 70, doc.y + 50);

// ============ PAGE 8: BENEFITS ANALYSIS ============
doc.addPage();
pageTitle('Benefits Analysis');

sectionTitle('For gBLUE Holders');

doc.rect(50, doc.y, 240, 120).fill(colors.background);
doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Passive Rewards', 60, doc.y + 10);
doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
  .text('• Earn tickets just by holding', 60, doc.y + 30)
  .text('• No staking or locking required', 60, doc.y + 45)
  .text('• Cross-chain flexibility', 60, doc.y + 60)
  .text('• Multiplied winning chances', 60, doc.y + 75)
  .text('• LP bonuses stack with tiers', 60, doc.y + 90);

doc.rect(300, doc.y - 120, 240, 120).fill(colors.background);
doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Increased Value', 310, doc.y - 110);
doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
  .text('• gBLUE becomes yield-bearing', 310, doc.y - 90)
  .text('• Reduced sell pressure', 310, doc.y - 75)
  .text('• Community engagement', 310, doc.y - 60)
  .text('• Exclusive Diamond benefits', 310, doc.y - 45)
  .text('• Long-term holder rewards', 310, doc.y - 30);

doc.moveDown(1);
sectionTitle('For Blue Protocol');

doc.rect(50, doc.y, 240, 120).fill('#dbeafe');
doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Ecosystem Growth', 60, doc.y + 10);
doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
  .text('• Increased token utility', 60, doc.y + 30)
  .text('• Deeper DEX liquidity', 60, doc.y + 45)
  .text('• Cross-chain presence', 60, doc.y + 60)
  .text('• Community loyalty', 60, doc.y + 75)
  .text('• Sustainable tokenomics', 60, doc.y + 90);

doc.rect(300, doc.y - 120, 240, 120).fill('#dbeafe');
doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary)
  .text('Raffle Benefits', 310, doc.y - 110);
doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
  .text('• Higher participation rates', 310, doc.y - 90)
  .text('• Larger prize pools', 310, doc.y - 75)
  .text('• More frequent rounds', 310, doc.y - 60)
  .text('• Engaged user base', 310, doc.y - 45)
  .text('• Viral growth potential', 310, doc.y - 30);

doc.moveDown(1);
sectionTitle('Projected Impact');

const impactY = doc.y + 10;
statBox('+40%', 'Holder Retention', 50, impactY, 115);
statBox('+60%', 'Raffle Participation', 175, impactY, 115);
statBox('+80%', 'DEX Liquidity', 300, impactY, 115);
statBox('3x', 'Community Growth', 425, impactY, 115);

// ============ PAGE 9: NEXT STEPS ============
doc.addPage();
pageTitle('Next Steps');

sectionTitle('Immediate Actions');

doc.rect(50, doc.y, 495, 150).fill(colors.background);
let stepY = doc.y + 15;

doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.accent)
  .text('1', 60, stepY);
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark)
  .text('Review & Approve Tier Structure', 85, stepY);
doc.fontSize(10).font('Helvetica').fillColor(colors.medium)
  .text('Confirm tier thresholds, ticket allocations, and multipliers', 85, stepY + 15);

doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.accent)
  .text('2', 60, stepY + 40);
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark)
  .text('Provide Chain Integration Details', 85, stepY + 40);
doc.fontSize(10).font('Helvetica').fillColor(colors.medium)
  .text('gBLUE contract addresses on Abstract and Arborean DEX', 85, stepY + 55);

doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.accent)
  .text('3', 60, stepY + 80);
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark)
  .text('Confirm LP Pool Priorities', 85, stepY + 80);
doc.fontSize(10).font('Helvetica').fillColor(colors.medium)
  .text('Which pools should receive highest incentives?', 85, stepY + 95);

doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.accent)
  .text('4', 60, stepY + 120);
doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.dark)
  .text('Kick Off Development', 85, stepY + 120);
doc.fontSize(10).font('Helvetica').fillColor(colors.medium)
  .text('Begin Phase 1 implementation upon approval', 85, stepY + 135);

doc.y += 180;

sectionTitle('Questions for Blue Protocol Team');

bullet('What are the gBLUE contract addresses on Abstract and Arborean?');
doc.moveDown(0.2);
bullet('Are there specific LP pools you want to prioritize?');
doc.moveDown(0.2);
bullet('Should Diamond tier have additional exclusive benefits?');
doc.moveDown(0.2);
bullet('What is the preferred launch timeline?');
doc.moveDown(0.2);
bullet('Any concerns about the tier thresholds or multipliers?');

doc.moveDown(1.5);

// Contact box
doc.rect(50, doc.y, 495, 80).fill(colors.primary);
doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.white)
  .text('Ready to Build the Future of gBLUE Rewards', 50, doc.y + 15, { width: 495, align: 'center' });
doc.fontSize(12).font('Helvetica').fillColor('#93c5fd')
  .text('This proposal represents a significant opportunity to add utility to gBLUE', 50, doc.y + 45, { width: 495, align: 'center' })
  .text('while driving engagement across the entire Blue Protocol ecosystem.', 50, doc.y + 60, { width: 495, align: 'center' });

// ============ BACK COVER ============
doc.addPage();
doc.rect(0, 0, 612, 842).fill(colors.dark);

doc.fontSize(32).font('Helvetica-Bold').fillColor(colors.white)
  .text('gBLUE Holders Club', 50, 300, { align: 'center' });
doc.moveDown(1);
doc.fontSize(16).font('Helvetica').fillColor(colors.light)
  .text('Rewarding Loyalty Across Chains', 50, 360, { align: 'center' });

doc.moveDown(4);
doc.fontSize(12).fillColor(colors.light)
  .text('BlueRaffle × Blue Protocol', 50, 500, { align: 'center' })
  .text('BSC • Abstract • Arborean DEX', 50, 520, { align: 'center' });

doc.fontSize(10).fillColor('#6b7280')
  .text('Proposal Document v1.0', 50, 700, { align: 'center' })
  .text(`Generated ${new Date().toLocaleDateString()}`, 50, 715, { align: 'center' });

// Finalize
doc.end();
console.log(`✅ Proposal generated: ${outputPath}`);
