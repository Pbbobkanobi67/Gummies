import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import ProgressivePage from './pages/ProgressivePage';
import { useWallet } from './hooks/useWallet';
import { useDice } from './hooks/useDice';
import { useProgressive } from './hooks/useProgressive';

function App() {
  const wallet = useWallet();
  const dice = useDice(wallet.signer);
  const progressive = useProgressive(wallet.signer);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-branding">
            <h1><span className="dice-icon">🎲</span> Blue Dice</h1>
            <p>Provably Fair | Blockhash Randomness</p>
          </div>
          <div className="header-wallet">
            {wallet.isCorrectNetwork === false && wallet.account && (
              <button className="btn btn-warning" onClick={wallet.switchNetwork}>
                Switch to BSC Testnet
              </button>
            )}
            {wallet.account ? (
              <div className="wallet-connected">
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
            <Route path="/" element={<HomePage wallet={wallet} dice={dice} />} />
            <Route path="/progressive" element={<ProgressivePage wallet={wallet} progressive={progressive} />} />
            <Route path="/history" element={<HistoryPage wallet={wallet} dice={dice} />} />
            <Route path="/admin" element={<AdminPage wallet={wallet} dice={dice} progressive={progressive} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
