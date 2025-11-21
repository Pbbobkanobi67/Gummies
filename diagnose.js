import { ethers } from 'ethers';
import fs from 'fs';

// Configuration
const RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const CONTRACT_ADDRESS = '0x99121F45cB98b38360970e4f7c268da5aD0FFDda';
const ADMIN_WALLET = '0xa757d90e353b3E045721A41236831238Fc84024F';

// Status enum mapping
const STATUS_NAMES = ['Pending', 'Active', 'WaitingVRF', 'Closed'];

async function diagnose() {
    console.log('🔍 Blue Raffle Diagnostic Tool\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Load ABI
        const abi = JSON.parse(fs.readFileSync('./BlueRaffleABI.json', 'utf8'));

        // Connect to BNB Testnet
        console.log('📡 Connecting to BNB Testnet...');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const currentTime = block.timestamp;

        console.log(`✅ Connected! Block: ${blockNumber}, Time: ${new Date(currentTime * 1000).toLocaleString()}\n`);

        // Get contract configuration
        console.log('⚙️  CONTRACT CONFIGURATION');
        console.log('───────────────────────────────────────────────────────────');

        const isPaused = await contract.paused();
        const minParticipants = await contract.minParticipants();
        const roundDuration = await contract.roundDuration();
        const minTickets = await contract.minTickets();
        const maxTickets = await contract.maxTickets();

        console.log(`Contract Paused: ${isPaused ? '🔴 YES (THIS IS THE PROBLEM!)' : '🟢 NO'}`);
        console.log(`Min Participants: ${minParticipants}`);
        console.log(`Round Duration: ${roundDuration}s (${roundDuration / 60} minutes)`);
        console.log(`Min Tickets: ${ethers.formatEther(minTickets)} BLUE`);
        console.log(`Max Tickets: ${ethers.formatEther(maxTickets)} BLUE`);
        console.log();

        // Get current round info
        console.log('🎰 CURRENT ROUND STATUS');
        console.log('───────────────────────────────────────────────────────────');

        const roundInfo = await contract.getCurrentRoundInfo();
        const roundId = roundInfo[0];
        const startTime = roundInfo[1];
        const endTime = roundInfo[2];
        const prizePool = roundInfo[3];
        const totalTickets = roundInfo[4];
        const uniqueWallets = roundInfo[5];
        const status = roundInfo[6];

        console.log(`Round ID: ${roundId}`);
        console.log(`Status: ${STATUS_NAMES[status]} (${status})`);
        console.log(`Unique Participants: ${uniqueWallets}`);
        console.log(`Total Tickets: ${ethers.formatEther(totalTickets)} BLUE`);
        console.log(`Prize Pool: ${ethers.formatEther(prizePool)} BLUE`);

        if (startTime > 0) {
            console.log(`Start Time: ${new Date(Number(startTime) * 1000).toLocaleString()}`);
            console.log(`End Time: ${new Date(Number(endTime) * 1000).toLocaleString()}`);
            const timeLeft = Number(endTime) - currentTime;
            if (timeLeft > 0) {
                console.log(`Time Remaining: ${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds`);
            } else {
                console.log(`Time Remaining: ⏰ EXPIRED (${Math.abs(Math.floor(timeLeft / 60))} minutes ago)`);
            }
        } else {
            console.log('Start Time: Not started yet (Pending status)');
        }
        console.log();

        // Get participants
        console.log('👥 PARTICIPANTS');
        console.log('───────────────────────────────────────────────────────────');

        const participants = await contract.getRoundParticipants(roundId);
        console.log(`Total: ${participants.length}`);

        for (let i = 0; i < participants.length; i++) {
            const addr = participants[i];
            const tickets = await contract.userTickets(roundId, addr);
            console.log(`  ${i + 1}. ${addr}`);
            console.log(`     Tickets: ${ethers.formatEther(tickets)} BLUE`);
        }
        console.log();

        // Check if can close
        console.log('🔒 CLOSE ROUND CHECK');
        console.log('───────────────────────────────────────────────────────────');

        try {
            const canClose = await contract.canCloseRound();
            console.log(`Can Close: ${canClose[0] ? '✅ YES' : '❌ NO'}`);
            console.log(`Close Reward: ${ethers.formatEther(canClose[1])} BLUE`);
            console.log(`Message: ${canClose[2]}`);
        } catch (error) {
            console.log(`❌ Error checking canCloseRound: ${error.message}`);
        }
        console.log();

        // Diagnosis
        console.log('🔬 DIAGNOSIS');
        console.log('═══════════════════════════════════════════════════════════');

        if (isPaused) {
            console.log('❌ ISSUE FOUND: Contract is PAUSED');
            console.log('   Solution: Call unpause() from owner wallet');
            console.log(`   Owner: ${ADMIN_WALLET}`);
            console.log();
        }

        if (status === 0) { // Pending
            console.log('⚠️  ISSUE: Round is in PENDING status');
            console.log(`   Current participants: ${uniqueWallets}`);
            console.log(`   Required: ${minParticipants}`);
            if (uniqueWallets < minParticipants) {
                console.log(`   ❌ Need ${Number(minParticipants) - Number(uniqueWallets)} more participant(s)`);
            } else {
                console.log('   ⚠️  Has enough participants but still PENDING');
                console.log('   This is the HARDCODED BUG: Line 95-100 checks >= 2 instead of >= minParticipants');
            }
            console.log();
        }

        if (status === 1) { // Active
            if (currentTime < endTime) {
                console.log('⏰ Round is ACTIVE but not ready to close yet');
                const remaining = Number(endTime) - currentTime;
                console.log(`   Time remaining: ${Math.floor(remaining / 60)} minutes`);
            } else {
                console.log('✅ Round is ready to close!');
                if (isPaused) {
                    console.log('   ❌ But contract is PAUSED - unpause first!');
                }
            }
            console.log();
        }

        if (status === 2) { // WaitingVRF
            console.log('⏳ Round is waiting for VRF response');
            console.log('   Check Chainlink VRF subscription status');
            console.log();
        }

        console.log('═══════════════════════════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.data) {
            console.error('Error data:', error.data);
        }
    }
}

diagnose();
