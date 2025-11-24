import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import { useRaffle } from './hooks/useRaffle';
import { Navigation } from './components/Navigation/Navigation';
import { HomePage } from './pages/HomePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  const {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    error: walletError,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const {
    contract,
    roundInfo,
    userTickets,
    loading,
    error: raffleError,
    buyTickets,
    requestDraw,
    executeDraw,
    canRequestDraw,
    canExecuteDraw,
    getPreviousRoundWinner,
  } = useRaffle(provider, signer, account);

  const [isOwner, setIsOwner] = useState(false);

  // Check if connected account is the contract owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!contract || !account) {
        setIsOwner(false);
        return;
      }

      try {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error('Error checking owner:', err);
        setIsOwner(false);
      }
    };

    checkOwner();
  }, [contract, account]);

  return (
    <Router>
      <div className="app">
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>🎰 Blue Raffle</h1>
            <p>Provably Fair | Blockhash Randomness</p>
          </div>

          {/* Wallet Connection */}
          <div className="wallet-section">
            {!isConnected ? (
              <div>
                <button
                  className="btn btn-primary"
                  onClick={connect}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
                {walletError && (
                  <div className="error-message" style={{ marginTop: '20px' }}>
                    {walletError}
                  </div>
                )}
              </div>
            ) : (
              <div className="wallet-info">
                <span className="wallet-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                {!isCorrectNetwork && (
                  <button
                    className="btn btn-secondary"
                    onClick={switchNetwork}
                    style={{ marginRight: '10px' }}
                  >
                    Switch to BSC Testnet
                  </button>
                )}
                <button className="btn btn-secondary" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <Navigation account={account} isOwner={isOwner} />

          {/* Routes */}
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  contract={contract}
                  roundInfo={roundInfo}
                  userTickets={userTickets}
                  loading={loading}
                  error={raffleError}
                  buyTickets={buyTickets}
                  requestDraw={requestDraw}
                  executeDraw={executeDraw}
                  canRequestDraw={canRequestDraw}
                  canExecuteDraw={canExecuteDraw}
                  getPreviousRoundWinner={getPreviousRoundWinner}
                  isConnected={isConnected}
                  isCorrectNetwork={isCorrectNetwork}
                  signer={signer}
                />
              }
            />
            <Route
              path="/analytics"
              element={<AnalyticsPage contract={contract} account={account} />}
            />
            <Route
              path="/admin"
              element={
                <AdminPage
                  contract={contract}
                  account={account}
                  signer={signer}
                  isConnected={isConnected}
                />
              }
            />
          </Routes>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Powered by Blockhash Randomness | BSC Testnet
            </p>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
