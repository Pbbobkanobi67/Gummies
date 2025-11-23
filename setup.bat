@echo off
REM Blue Raffle - Automated Setup Script for Windows
REM This script will set up everything for you!

echo.
echo ====================================
echo  Blue Raffle - Automated Setup
echo ====================================
echo.

REM Step 1: Install backend dependencies
echo [1/6] Installing Hardhat dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Backend dependencies installed
echo.

REM Step 2: Install frontend dependencies
echo [2/6] Installing React frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo.
echo [SUCCESS] Frontend dependencies installed
echo.

REM Step 3: Configure environment
echo [3/6] Configuring environment...
echo.

if exist .env (
    echo WARNING: .env file already exists!
    set /p OVERWRITE="Do you want to overwrite it? (y/n): "
    if /i not "%OVERWRITE%"=="y" (
        echo Skipping .env creation. Using existing file.
        goto :skip_env
    )
)

echo.
echo Please enter your configuration:
echo.

REM Get private key
set /p PRIVATE_KEY="Enter your private key (without 0x): "

REM Get wallet addresses (optional)
echo.
set /p TREASURY_WALLET="Enter Treasury wallet address (or press Enter to use deployer): "
set /p DEVELOPER_WALLET="Enter Developer wallet address (or press Enter to use deployer): "

REM Create .env file
(
echo # Blue Raffle Blockhash - Deployment Configuration
echo # Generated on %date% %time%
echo.
echo # Your BNB Testnet Private Key
echo PRIVATE_KEY=%PRIVATE_KEY%
echo.
echo # BLUE Token Address on BNB Testnet
echo BLUE_TOKEN=0xf11Af396703E11D48780B5154E52Fd7b430C6C01
echo.
echo # Wallet Addresses
echo TREASURY_WALLET=%TREASURY_WALLET%
echo DEVELOPER_WALLET=%DEVELOPER_WALLET%
echo.
echo # BscScan API Key ^(optional - for contract verification^)
echo BSCSCAN_API_KEY=
) > .env

echo.
echo [SUCCESS] .env file created
echo.

:skip_env

REM Step 4: Compile contract
echo [4/6] Compiling smart contract...
call npm run compile
if %errorlevel% neq 0 (
    echo ERROR: Compilation failed
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Contract compiled successfully
echo.

REM Step 5: Deploy contract
echo [5/6] Deploying contract to BSC Testnet...
echo.
echo WARNING: Make sure you have BNB on BSC Testnet for gas fees!
echo.
pause

call npm run deploy
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed. Please check the error above.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Contract deployed successfully!
echo.

REM Step 6: Completion message
echo [6/6] Setup complete!
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open a new command prompt
echo 2. Run: cd frontend
echo 3. Run: npm run dev
echo 4. Open http://localhost:3000 in your browser
echo 5. Connect your wallet and start testing!
echo.
echo Or use the quick start script:
echo   start-frontend.bat
echo.

set /p START_FRONTEND="Do you want to start the frontend now? (y/n): "
if /i "%START_FRONTEND%"=="y" (
    echo.
    echo Starting frontend...
    cd frontend
    call npm run dev
)

echo.
echo Press any key to exit...
pause >nul
