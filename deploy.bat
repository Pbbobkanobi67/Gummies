@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Blue Raffle - Automated Deployment
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "contracts" (
    echo [ERROR] contracts folder not found!
    echo Please run this script from your Blue-Raffle project root.
    echo.
    pause
    exit /b 1
)

if not exist "scripts" (
    echo [ERROR] scripts folder not found!
    echo Please run this script from your Blue-Raffle project root.
    echo.
    pause
    exit /b 1
)

echo [Step 1/6] Checking for required files...
echo.

:: Check if source files exist
set MISSING_FILES=0

if not exist "BlueRaffle_FIXED.sol" (
    echo [ERROR] BlueRaffle_FIXED.sol not found!
    echo Did you pull from git? Run: git pull
    set MISSING_FILES=1
)

if not exist "deploy-fixed-contract.js" (
    echo [ERROR] deploy-fixed-contract.js not found!
    echo Did you pull from git? Run: git pull
    set MISSING_FILES=1
)

if not exist ".env.example" (
    echo [ERROR] .env.example not found!
    echo Did you pull from git? Run: git pull
    set MISSING_FILES=1
)

if %MISSING_FILES%==1 (
    echo.
    echo Please pull the latest code from git:
    echo   git pull origin claude/blue-raffle-dapp-01KdSVRdN6wEHzcuv2Jg96S8
    echo.
    pause
    exit /b 1
)

echo [OK] All required files found!
echo.

echo [Step 2/6] Copying contract to contracts folder...
copy /Y "BlueRaffle_FIXED.sol" "contracts\BlueRaffle.sol" >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy BlueRaffle_FIXED.sol
    pause
    exit /b 1
)
echo [OK] Contract copied to contracts\BlueRaffle.sol
echo.

echo [Step 3/6] Copying deployment script...
copy /Y "deploy-fixed-contract.js" "scripts\deploy.js" >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy deployment script
    pause
    exit /b 1
)
echo [OK] Deployment script copied to scripts\deploy.js
echo.

echo [Step 4/6] Checking .env configuration...
if not exist ".env" (
    echo [WARNING] .env file not found! Creating from template...
    copy ".env.example" ".env" >nul
    echo [CREATED] .env file created!
    echo.
    echo ========================================
    echo  IMPORTANT: Edit .env file NOW!
    echo ========================================
    echo.
    echo Please add your PRIVATE_KEY to .env file:
    echo   1. Open .env with Notepad
    echo   2. Replace "your_private_key_here" with your actual private key
    echo   3. Save and close
    echo   4. Run this script again
    echo.
    notepad .env
    echo.
    echo After saving .env, press any key to continue or Ctrl+C to exit...
    pause >nul
)

:: Check if private key is configured
findstr /C:"your_private_key_here" .env >nul
if not errorlevel 1 (
    echo [ERROR] .env file is not configured!
    echo Please edit .env and add your private key.
    echo.
    notepad .env
    echo.
    echo After saving, run this script again.
    pause
    exit /b 1
)

echo [OK] .env file is configured!
echo.

echo [Step 5/6] Compiling contract...
echo.
call npx hardhat compile
if errorlevel 1 (
    echo.
    echo [ERROR] Compilation failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo.
echo [OK] Contract compiled successfully!
echo.

echo [Step 6/6] Deploying to BNB Testnet...
echo.
echo This may take 1-2 minutes...
echo.
call npx hardhat run scripts\deploy.js --network bsc_testnet
if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed!
    echo Check the error messages above.
    echo.
    echo Common issues:
    echo - Insufficient BNB balance (need ~0.1 BNB)
    echo - Wrong network in hardhat.config.js
    echo - Invalid private key in .env
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Copy your new contract address from above
echo.
echo 2. Add to VRF subscription:
echo    - Go to: https://vrf.chain.link/bnb-chain-testnet
echo    - Subscription ID: 43371163114061566586232043748699703279439038188185138377217877577027786652944
echo    - Click "Add Consumer"
echo    - Paste your new contract address
echo.
echo 3. Update your frontend config.js:
echo    - Change CONTRACT_ADDRESS to your new address
echo.
echo 4. Test the raffle!
echo.
pause
