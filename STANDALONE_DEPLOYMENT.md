# BlueRaffle Standalone Deployment Guide

## Problem Solved

The previous BlueRaffle contract was failing to close rounds with error "execution reverted: 0x". Root cause was:

**VRF v2.5 on BNB Testnet uses `uint256` for subscription IDs, but the old contract inherited from VRFConsumerBaseV2 which casts to `uint64`, truncating large subscription IDs.**

Your subscription ID: `26655927599451290729520880429262733726305991805472180956508373717196718435172`
Max uint64 value: `18,446,744,073,709,551,615`

The cast `uint64(subscriptionId)` was truncating your ID to garbage, causing VRF coordinator to reject all requests.

## Solution

**BlueRaffle_Standalone.sol** - Rewritten contract that:
- ✅ Does NOT inherit from VRFConsumerBaseV2 (which requires uint64)
- ✅ Manually defines `IVRFCoordinatorV2Plus` interface with uint256 subscription IDs
- ✅ Uses `rawFulfillRandomWords` callback instead of inheritance
- ✅ Only depends on OpenZeppelin (no Chainlink package dependency issues)
- ✅ Fully compatible with VRF v2.5 on BNB Testnet

## Files for Your Windows PC

Copy these files to `C:\Users\bob\Blue-Raffle\`:

1. **hardhat.config.cjs** - Minimal Hardhat config without hardhat-toolbox (avoids dependency conflicts)
2. **BlueRaffle_Standalone.sol** - Fixed contract with VRF v2.5 support
3. **deploy-standalone.cjs** - Deployment script with correct VRF v2.5 settings

## Deployment Steps

### 1. Install Dependencies (on your Windows PC)

```bash
cd C:\Users\bob\Blue-Raffle
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers@^6.9.0 @openzeppelin/contracts dotenv --legacy-peer-deps
```

### 2. Ensure .env File Exists

Create `.env` in `C:\Users\bob\Blue-Raffle\` with:

```
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key
```

Your admin wallet: `0x5F55f9bBaBe64c4b9070655DEC8DB6519EbdDBf2`

### 3. Compile Contract

```bash
npx hardhat compile --config hardhat.config.cjs
```

If successful, you'll see:
```
Compiled 1 Solidity file successfully
```

### 4. Deploy Contract

```bash
node deploy-standalone.cjs
```

This will:
- Deploy BlueRaffle_Standalone with VRF v2.5 settings
- Show you the new contract address
- Provide next steps

### 5. Add Contract as VRF Consumer

Go to: https://vrf.chain.link/bnb-chain-testnet/26655927599451290729520880429262733726305991805472180956508373717196718435172

Click "Add consumer" and paste your new contract address.

### 6. Update Frontend

In your frontend `config.js`, update the contract address to the newly deployed address.

### 7. Test closeRound()

Use the existing diagnostic tools or try closing a round after:
- At least 2 participants buy tickets
- Round timer expires (5 minutes by default)

## Why This Works

The standalone contract:

```solidity
// OLD (BROKEN):
contract BlueRaffle is VRFConsumerBaseV2 {
    uint256 requestId = vrfCoordinator.requestRandomWords(
        keyHash,
        uint64(subscriptionId),  // ❌ TRUNCATES LARGE IDs!
        ...
    );
}

// NEW (FIXED):
interface IVRFCoordinatorV2Plus {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,  // ✅ uint256 - no truncation!
        ...
    ) external returns (uint256);
}

contract BlueRaffle is Ownable, ReentrancyGuard {
    uint256 requestId = vrfCoordinator.requestRandomWords(
        keyHash,
        subscriptionId,  // ✅ uint256 used directly
        ...
    );

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        require(msg.sender == address(vrfCoordinator));
        fulfillRandomWords(requestId, randomWords);
    }
}
```

## Verification

After deployment, verify on BSCScan (command will be shown after deployment):

```bash
npx hardhat verify --network bsc_testnet <CONTRACT_ADDRESS> <constructor args...>
```

## Troubleshooting

**If npm install fails:**
- Try adding `--force` flag
- Make sure you're using Node.js 18+
- Delete `node_modules` and `package-lock.json` and try again

**If compilation fails:**
- Check that all 3 files (hardhat.config.cjs, BlueRaffle_Standalone.sol, deploy-standalone.cjs) are in the same directory
- Make sure .env file exists with PRIVATE_KEY

**If deployment fails:**
- Check BNB balance in admin wallet (need ~0.3 BNB for gas)
- Verify you're connected to BNB Testnet (Chain ID 97)
- Check that PRIVATE_KEY in .env is correct

## Expected Result

After successful deployment:
- ✅ Contract deploys without errors
- ✅ closeRound() function works when all conditions met
- ✅ VRF picks winner within 1-2 minutes
- ✅ New round starts automatically
- ✅ No more "execution reverted: 0x" errors

## Support

If you still have issues after deploying the standalone contract, the problem is likely:
1. VRF subscription not funded (need LINK tokens)
2. Contract not added as consumer on VRF subscription
3. Network connectivity issues

Check VRF subscription at: https://vrf.chain.link/bnb-chain-testnet/26655927599451290729520880429262733726305991805472180956508373717196718435172
