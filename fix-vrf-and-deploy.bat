@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Blue Raffle - Fix VRF Coordinator
echo ========================================
echo.

:: Check if in correct directory
if not exist "scripts\deploy.cjs" (
    echo [ERROR] scripts\deploy.cjs not found!
    echo Please run this from C:\Users\bob\Blue-Raffle
    pause
    exit /b 1
)

echo [Step 1/3] Updating VRF Coordinator address...
echo.

:: Create backup
copy scripts\deploy.cjs scripts\deploy.cjs.backup >nul
echo [OK] Backup created: scripts\deploy.cjs.backup

:: Update the VRF coordinator address
powershell -Command "(Get-Content scripts\deploy.cjs) -replace '0x6A2AAd07396B36Fe02a22b33cf443582f682c82f', '0xDA3b641D438362C440Ac5458c57e00a712b66700' | Set-Content scripts\deploy.cjs"

echo [OK] VRF Coordinator updated to v2.5
echo     Old: 0x6A2AAd07396B36Fe02a22b33cf443582f682c82f
echo     New: 0xDA3b641D438362C440Ac5458c57e00a712b66700
echo.

echo [Step 2/3] Deploying contract with correct VRF...
echo.
echo This will take 1-2 minutes...
echo.

call npx hardhat run scripts\deploy.cjs --network bsc_testnet

if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed!
    echo Restoring backup...
    copy scripts\deploy.cjs.backup scripts\deploy.cjs >nul
    echo Backup restored.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo [Step 3/3] IMPORTANT NEXT STEPS:
echo.
echo 1. Copy your new contract address from above
echo.
echo 2. Add to VRF subscription:
echo    - Go to: https://vrf.chain.link/bnb-chain-testnet
echo    - Subscription ID: 43371163114061566586232043748699703279439038188185138377217877577027786652944
echo    - Click "Add Consumer"
echo    - Paste your NEW contract address
echo.
echo 3. Update frontend config.js:
echo    - File: C:\Users\bob\Blue-Raffle\frontend\src\config.js
echo    - Change CONTRACT_ADDRESS to your new address
echo.
echo 4. Test the raffle - it should work now!
echo.
pause
