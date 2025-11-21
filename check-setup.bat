@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Blue Raffle - Setup Checker
echo ========================================
echo.

:: Check Node.js
echo [Checking] Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org
    set HAS_ERROR=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js found: !NODE_VERSION!
)
echo.

:: Check npm
echo [Checking] npm installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    set HAS_ERROR=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm found: !NPM_VERSION!
)
echo.

:: Check if in project directory
echo [Checking] Project structure...
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Are you in the Blue-Raffle project directory?
    set HAS_ERROR=1
) else (
    echo [OK] package.json found
)

if not exist "hardhat.config.js" (
    echo [WARNING] hardhat.config.js not found!
    echo Hardhat may not be installed.
    set HAS_ERROR=1
) else (
    echo [OK] hardhat.config.js found
)

if not exist "contracts" (
    echo [WARNING] contracts folder not found!
    set HAS_ERROR=1
) else (
    echo [OK] contracts folder found
)

if not exist "scripts" (
    echo [WARNING] scripts folder not found!
    set HAS_ERROR=1
) else (
    echo [OK] scripts folder found
)
echo.

:: Check for deployment files
echo [Checking] Deployment files...
if not exist "BlueRaffle_FIXED.sol" (
    echo [WARNING] BlueRaffle_FIXED.sol not found
    echo Did you pull from git?
) else (
    echo [OK] BlueRaffle_FIXED.sol found
)

if not exist "deploy-fixed-contract.js" (
    echo [WARNING] deploy-fixed-contract.js not found
    echo Did you pull from git?
) else (
    echo [OK] deploy-fixed-contract.js found
)

if not exist ".env.example" (
    echo [WARNING] .env.example not found
) else (
    echo [OK] .env.example found
)
echo.

:: Check .env file
echo [Checking] Environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found
    echo You'll need to create this before deploying
) else (
    echo [OK] .env file exists

    :: Check if configured
    findstr /C:"your_private_key_here" .env >nul
    if not errorlevel 1 (
        echo [WARNING] .env contains default private key
        echo You need to add your actual private key!
    ) else (
        echo [OK] .env appears to be configured
    )
)
echo.

:: Check Hardhat installation
echo [Checking] Hardhat installation...
if exist "node_modules\hardhat" (
    echo [OK] Hardhat is installed
) else (
    echo [WARNING] Hardhat not found in node_modules
    echo Run: npm install
)
echo.

:: Summary
echo ========================================
echo  Summary
echo ========================================
echo.

if defined HAS_ERROR (
    echo [RESULT] Some issues found above
    echo Please fix them before deploying
) else (
    echo [RESULT] Everything looks good!
    echo You're ready to deploy!
    echo.
    echo To deploy, run: deploy.bat
)
echo.
pause
