import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import Navigation from './components/Navigation/Navigation';
import AIAssistant from './components/AIAssistant/AIAssistant';
import CasinoPage from './pages/CasinoPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProgressivePage from './pages/ProgressivePage';
import RafflePage from './pages/RafflePage';
import SlotsPage from './pages/SlotsPage';
import FaucetPage from './pages/FaucetPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import DocsPage from './pages/DocsPage';
import { GameProvider } from './contexts/GameContext';
import { useWallet } from './hooks/useWallet';
import { useDice, BetType, BetTypeLabels } from './hooks/useDice';
import { useProgressive } from './hooks/useProgressive';
import { useRaffle } from './hooks/useRaffle';

const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";

// Admin wallets (lowercase for comparison)
const ADMIN_WALLETS = [
  '0x2347ba6939476b0be50f4e8ba7c2419555555225',
  '0x5f55f9bbabe64c4b9070655dec8db6519ebddbf2'
];

function App() {
  const wallet = useWallet();
  const dice = useDice(wallet.signer);
  const progressive = useProgressive(wallet.signer);
  const raffle = useRaffle(wallet.signer, wallet.account);
  const [blueBalance, setBlueBalance] = useState('0');
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiStrategy, setAiStrategy] = useState(null);
  const [proMode, setProMode] = useState(() => {
    const saved = localStorage.getItem('blueCasino_proMode');
    return saved === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Sync proMode with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('blueCasino_proMode');
      setProMode(saved === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    // Also poll for changes within the same window
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Current bet settings (lifted from BetControls for AI to see)
  const [currentBet, setCurrentBet] = useState({
    betType: BetType.ODD,
    betTypeName: 'Odd',
    chosenNumber: 3,
    betAmount: ''
  });

  // Handle AI strategy application - navigate to dice page and set values
  const handleApplyAIStrategy = (strategy) => {
    setAiStrategy(strategy);
    navigate('/dice');
  };

  // Check if connected wallet is admin
  useEffect(() => {
    if (wallet.account) {
      const walletLower = wallet.account.toLowerCase();
      const adminCheck = ADMIN_WALLETS.includes(walletLower);
      console.log('Admin check:', { wallet: walletLower, adminWallets: ADMIN_WALLETS, isAdmin: adminCheck });
      setIsAdmin(adminCheck);
    } else {
      setIsAdmin(false);
    }
  }, [wallet.account]);

  // Fetch BLUE balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet.account || !wallet.signer) {
        setBlueBalance('0');
        return;
      }

      try {
        const blueToken = new ethers.Contract(
          BLUE_TOKEN,
          ["function balanceOf(address account) view returns (uint256)"],
          wallet.signer
        );
        const balance = await blueToken.balanceOf(wallet.account);
        setBlueBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Error fetching BLUE balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [wallet.account, wallet.signer]);

  // Create provider for ethers
  const provider = wallet.signer?.provider || null;

  return (
    <GameProvider provider={provider} signer={wallet.signer} account={wallet.account}>
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-branding">
            <h1><span className="casino-icon">🎰</span> Blue Casino</h1>
            <p>Provably Fair Gaming on BSC</p>
          </div>
          <div className="header-wallet">
            {isAdmin && (
              <Link to="/admin" className="btn btn-admin">
                Admin
              </Link>
            )}
            <a
              href="https://www.bluebnb.xyz/buy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-buy"
            >
              Buy BLUE
            </a>
            {wallet.isCorrectNetwork === false && wallet.account && (
              <button className="btn btn-warning" onClick={wallet.switchNetwork}>
                Switch to BSC Testnet
              </button>
            )}
            {wallet.account ? (
              <div className="wallet-connected">
                <span className="blue-balance-header">
                  {parseFloat(blueBalance).toLocaleString()} BLUE
                </span>
                <span className="wallet-address-header">
                  {wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}
                </span>
                <button className="btn btn-secondary" onClick={wallet.disconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={wallet.connect} disabled={wallet.isConnecting}>
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        <Navigation />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CasinoPage wallet={wallet} dice={dice} progressive={progressive} raffle={raffle} />} />
            <Route path="/dice" element={<HomePage wallet={wallet} dice={dice} aiStrategy={aiStrategy} clearAiStrategy={() => setAiStrategy(null)} currentBet={currentBet} onBetChange={setCurrentBet} />} />
            <Route path="/progressive" element={<ProgressivePage wallet={wallet} progressive={progressive} />} />
            <Route path="/raffle" element={<RafflePage wallet={wallet} raffle={raffle} />} />
            <Route path="/slots" element={<SlotsPage wallet={wallet} />} />
            <Route path="/history" element={<PlayerStatsPage wallet={wallet} dice={dice} progressive={progressive} raffle={raffle} />} />
            <Route path="/admin" element={<AdminPage wallet={wallet} dice={dice} progressive={progressive} raffle={raffle} />} />
            <Route path="/faucet" element={<FaucetPage wallet={wallet} />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </main>
      </div>

      {/* AI Betting Assistant - floating widget (Pro Mode only) */}
      {proMode && (
        <AIAssistant
          blueBalance={blueBalance}
          playerStats={dice.playerStats}
          onApplyStrategy={handleApplyAIStrategy}
          currentBet={currentBet}
          currentPage={location.pathname}
        />
      )}
    </div>
    </GameProvider>
  );
}

export default App;
