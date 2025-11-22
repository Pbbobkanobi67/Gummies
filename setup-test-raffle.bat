@echo off
echo ========================================
echo Blue Raffle Test Setup
echo ========================================
echo.

REM Create test folder
cd C:\Users\bob
if exist raffle-test (
    echo Removing old raffle-test folder...
    rmdir /s /q raffle-test
)
mkdir raffle-test
cd raffle-test

echo Creating test dapp...

REM Create the HTML file
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<title^>Blue Raffle Test^</title^>
echo     ^<script src="https://cdn.jsdelivr.net/npm/ethers@6.9.0/dist/ethers.umd.min.js"^>^</script^>
echo     ^<style^>
echo         body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
echo         button { padding: 12px 24px; margin: 5px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
echo         button:hover { background: #0056b3; }
echo         .info { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
echo         .success { color: green; font-weight: bold; }
echo         .error { color: red; font-weight: bold; }
echo         h1 { color: #333; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>🎰 Blue Raffle Test Dapp^</h1^>
echo
echo     ^<div class="info"^>
echo         ^<strong^>Contract:^</strong^> 0x47a2bc07d7cF2A11D483140654Fd82f962D34383^<br^>
echo         ^<strong^>Network:^</strong^> BNB Testnet ^(Chain ID: 97^)^<br^>
echo         ^<strong^>BLUE Token:^</strong^> 0x8cd0d76c0ad377378ab6ce878e7f11f2e5c6a2e8
echo     ^</div^>
echo.
echo     ^<div id="status"^>^</div^>
echo
echo     ^<button onclick="connectWallet()"^>🔗 Connect Wallet^</button^>
echo     ^<button onclick="getRoundInfo()"^>ℹ️ Get Round Info^</button^>
echo     ^<button onclick="buyTickets()"^>🎫 Buy 5 BLUE Tickets^</button^>
echo     ^<button onclick="closeRound()"^>🏁 Close Round^</button^>
echo.
echo     ^<div id="output"^>^</div^>
echo.
echo     ^<script^>
echo         const CONTRACT_ADDRESS = "0x47a2bc07d7cF2A11D483140654Fd82f962D34383";
echo         const BLUE_TOKEN = "0x8cd0d76c0ad377378ab6ce878e7f11f2e5c6a2e8";
echo
echo         const ABI = [
echo             "function buyTickets(uint256 amount) external",
echo             "function closeRound() external",
echo             "function getCurrentRoundInfo() external view returns (uint256 roundId, uint256 startTime, uint256 endTime, uint256 prizePool, uint256 totalTickets, uint256 uniqueWallets, uint8 status)",
echo             "function canCloseRound() external view returns (bool, uint256, string memory)",
echo             "function roundDuration() external view returns (uint256)",
echo             "function minParticipants() external view returns (uint256)"
echo         ];
echo.
echo         const TOKEN_ABI = [
echo             "function approve(address spender, uint256 amount) external returns (bool)",
echo             "function balanceOf(address account) external view returns (uint256)"
echo         ];
echo.
echo         let provider, signer, contract, tokenContract;
echo.
echo         async function connectWallet() {
echo             try {
echo                 if (!window.ethereum) {
echo                     alert("Please install MetaMask!");
echo                     return;
echo                 }
echo.
echo                 provider = new ethers.BrowserProvider(window.ethereum);
echo                 await provider.send("eth_requestAccounts", []);
echo                 signer = await provider.getSigner();
echo
echo                 const address = await signer.getAddress();
echo                 const network = await provider.getNetwork();
echo.
echo                 contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
echo                 tokenContract = new ethers.Contract(BLUE_TOKEN, TOKEN_ABI, signer);
echo.
echo                 document.getElementById('status').innerHTML =
echo                     `^<div class="success"^>✅ Connected: ${address}^<br^>Network: ${network.name} (${network.chainId})^</div^>`;
echo             } catch (error) {
echo                 document.getElementById('status').innerHTML =
echo                     `^<div class="error"^>❌ Error: ${error.message}^</div^>`;
echo             }
echo         }
echo.
echo         async function getRoundInfo() {
echo             try {
echo                 const info = await contract.getCurrentRoundInfo();
echo                 const canClose = await contract.canCloseRound();
echo                 const duration = await contract.roundDuration();
echo                 const minPart = await contract.minParticipants();
echo.
echo                 const statusNames = ['Pending', 'Active', 'WaitingVRF', 'Closed'];
echo                 const now = Math.floor(Date.now() / 1000);
echo                 const timeLeft = Number(info.endTime) - now;
echo.
echo                 document.getElementById('output').innerHTML = `
echo                     ^<div class="info"^>
echo                         ^<strong^>Round Info:^</strong^>^<br^>
echo                         Round ID: ${info.roundId.toString()}^<br^>
echo                         Status: ${statusNames[info.status]}^<br^>
echo                         Prize Pool: ${ethers.formatEther(info.prizePool)} BLUE^<br^>
echo                         Participants: ${info.uniqueWallets.toString()} / ${minPart.toString()} minimum^<br^>
echo                         Total Tickets: ${ethers.formatEther(info.totalTickets)} BLUE^<br^>
echo                         Time Left: ${timeLeft ^> 0 ? timeLeft + ' seconds' : 'ENDED'}^<br^>
echo                         Duration: ${Number(duration) / 60} minutes^<br^>
echo                         ^<br^>
echo                         ^<strong^>Can Close Round:^</strong^> ${canClose[0] ? '✅ YES' : '❌ NO'}^<br^>
echo                         Reward: ${ethers.formatEther(canClose[1])} BLUE^<br^>
echo                         Message: ${canClose[2]}
echo                     ^</div^>
echo                 `;
echo             } catch (error) {
echo                 document.getElementById('output').innerHTML =
echo                     `^<div class="error"^>❌ Error: ${error.message}^</div^>`;
echo             }
echo         }
echo.
echo         async function buyTickets() {
echo             try {
echo                 const amount = ethers.parseEther("5");
echo
echo                 document.getElementById('output').innerHTML = "Approving BLUE tokens...";
echo                 const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
echo                 await approveTx.wait();
echo.
echo                 document.getElementById('output').innerHTML = "Buying tickets...";
echo                 const tx = await contract.buyTickets(amount);
echo                 await tx.wait();
echo.
echo                 document.getElementById('output').innerHTML =
echo                     `^<div class="success"^>✅ Bought 5 BLUE tickets!^<br^>Tx: ${tx.hash}^</div^>`;
echo             } catch (error) {
echo                 document.getElementById('output').innerHTML =
echo                     `^<div class="error"^>❌ Error: ${error.message}^</div^>`;
echo             }
echo         }
echo.
echo         async function closeRound() {
echo             try {
echo                 document.getElementById('output').innerHTML = "Closing round...";
echo                 const tx = await contract.closeRound();
echo                 await tx.wait();
echo.
echo                 document.getElementById('output').innerHTML =
echo                     `^<div class="success"^>✅ Round closed!^<br^>Tx: ${tx.hash}^<br^>Winner will be selected by VRF in 1-2 minutes.^</div^>`;
echo             } catch (error) {
echo                 document.getElementById('output').innerHTML =
echo                     `^<div class="error"^>❌ Error: ${error.message}^</div^>`;
echo             }
echo         }
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Test dapp created at: C:\Users\bob\raffle-test\index.html
echo.
echo NEXT STEPS:
echo.
echo 1. Add contract as VRF consumer:
echo    https://vrf.chain.link/bnb-chain-testnet/26655927599451290729520880429262733726305991805472180956508373717196718435172
echo    Contract: 0x47a2bc07d7cF2A11D483140654Fd82f962D34383
echo.
echo 2. Opening dapp in browser...
echo.

start index.html

echo.
echo INSTRUCTIONS:
echo - Click "Connect Wallet" and connect MetaMask to BNB Testnet
echo - Click "Get Round Info" to see current round status
echo - Click "Buy 5 BLUE Tickets" to enter the raffle
echo - Wait 5 minutes for timer to expire
echo - Click "Close Round" to pick winner via VRF
echo.
echo Contract Address: 0x47a2bc07d7cF2A11D483140654Fd82f962D34383
echo.
pause
