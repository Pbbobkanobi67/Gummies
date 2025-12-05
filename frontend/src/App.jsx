import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import { useRaffle } from './hooks/useRaffle';
import { Navigation } from './components/Navigation/Navigation';
import { HomePage } from './pages/HomePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';
import { SlotsPage } from './pages/SlotsPage';
import { GameProvider, useGameContext } from './contexts/GameContext';

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
      <GameProvider provider={provider} signer={signer} account={account}>
        <div className="app">
          <div className="container">
            {/* Header with Wallet */}
            <div className="header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', marginRight: '12px' }}>🎰</span>
                <div>
                  <h1 style={{ margin: 0, fontSize: '2rem' }}>Blue Casino</h1>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Provably Fair | Blockhash Randomness</p>
                </div>
              </div>

              {/* Wallet Connection */}
              <div>
                {!isConnected ? (
                  <button
                    className="btn btn-primary"
                    onClick={connect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="wallet-address">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                    {!isCorrectNetwork && (
                      <button
                        className="btn btn-secondary"
                        onClick={switchNetwork}
                      >
                        BSC Testnet
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={disconnect}>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Error */}
            {walletError && (
              <div className="error-message" style={{ marginBottom: '20px' }}>
                {walletError}
              </div>
            )}

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
                path="/slots"
                element={
                  <SlotsPage
                    contract={null}
                    signer={signer}
                    isConnected={isConnected}
                    isCorrectNetwork={isCorrectNetwork}
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
      </GameProvider>
    </Router>
  );
}

export default App;
