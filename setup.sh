#!/bin/bash

# Blue Raffle - Automated Setup Script
# This script will set up everything for you!

set -e  # Exit on any error

echo "🎰 Blue Raffle - Automated Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install backend dependencies
echo -e "${BLUE}[1/6] Installing Hardhat dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Step 2: Install frontend dependencies
echo -e "${BLUE}[2/6] Installing React frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Step 3: Configure environment
echo -e "${BLUE}[3/6] Configuring environment...${NC}"

if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists!${NC}"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping .env creation. Using existing file.${NC}"
        ENV_CREATED=false
    else
        ENV_CREATED=true
    fi
else
    ENV_CREATED=true
fi

if [ "$ENV_CREATED" = true ]; then
    echo ""
    echo -e "${YELLOW}📝 Please enter your configuration:${NC}"
    echo ""

    # Get private key
    read -sp "Enter your private key (without 0x): " PRIVATE_KEY
    echo ""

    # Get wallet addresses (optional)
    echo ""
    read -p "Enter Treasury wallet address (or press Enter to use deployer): " TREASURY_WALLET
    read -p "Enter Developer wallet address (or press Enter to use deployer): " DEVELOPER_WALLET

    # Create .env file
    cat > .env << EOF
# Blue Raffle Blockhash - Deployment Configuration
# Generated on $(date)

# Your BNB Testnet Private Key
PRIVATE_KEY=$PRIVATE_KEY

# BLUE Token Address on BNB Testnet
BLUE_TOKEN=0xf11Af396703E11D48780B5154E52Fd7b430C6C01

# Wallet Addresses
TREASURY_WALLET=${TREASURY_WALLET:-YourTreasuryWallet}
DEVELOPER_WALLET=${DEVELOPER_WALLET:-YourDeveloperWallet}

# BscScan API Key (optional - for contract verification)
BSCSCAN_API_KEY=
EOF

    echo -e "${GREEN}✅ .env file created${NC}"
fi
echo ""

# Step 4: Compile contract
echo -e "${BLUE}[4/6] Compiling smart contract...${NC}"
npm run compile
echo -e "${GREEN}✅ Contract compiled successfully${NC}"
echo ""

# Step 5: Deploy contract
echo -e "${BLUE}[5/6] Deploying contract to BSC Testnet...${NC}"
echo -e "${YELLOW}⚠️  Make sure you have BNB on BSC Testnet for gas fees!${NC}"
echo ""
read -p "Press Enter to deploy (or Ctrl+C to cancel)..."

npm run deploy

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed. Please check the error above.${NC}"
    echo ""
    exit 1
fi

# Step 6: Start frontend
echo -e "${BLUE}[6/6] Ready to start frontend!${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Open a new terminal window"
echo "2. Run: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Connect your wallet and start testing!"
echo ""
echo "Or run this command to start the frontend now:"
echo -e "${YELLOW}cd frontend && npm run dev${NC}"
echo ""

read -p "Do you want to start the frontend now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Starting frontend...${NC}"
    cd frontend
    npm run dev
fi
