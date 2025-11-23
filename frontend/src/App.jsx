import React, { useState, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useRaffle } from './hooks/useRaffle';
import { RaffleCard } from './components/PlayerView/RaffleCard';
import { TicketPurchase } from './components/PlayerView/TicketPurchase';
import { WinnerAnnouncement } from './components/PlayerView/WinnerAnnouncement';
import { DrawControls } from './components/PlayerView/DrawControls';
import { AdminPanel } from './components/AdminPanel/AdminPanel';

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

  const [previousWinner, setPreviousWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);

  // Check for previous round winner
  useEffect(() => {
    const checkPreviousWinner = async () => {
      if (roundInfo && roundInfo.roundId && parseInt(roundInfo.roundId) > 1) {
        const winner = await getPreviousRoundWinner();
        if (winner && winner.winner !== '0x0000000000000000000000000000000000000000') {
          setPreviousWinner(winner);
          setShowWinner(true);
        }
      }
    };

    checkPreviousWinner();
  }, [roundInfo?.roundId]);

  const handlePlayAgain = () => {
    setShowWinner(false);
    setPreviousWinner(null);
  };

  const handleViewRound = () => {
    setShowWinner(false);
    // Could navigate to round history or details
  };

  return (
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

        {/* Main Content */}
        {isConnected && isCorrectNetwork ? (
          <>
            {/* Winner Announcement */}
            {showWinner && previousWinner && (
              <WinnerAnnouncement
                winner={previousWinner}
                onPlayAgain={handlePlayAgain}
                onViewRound={handleViewRound}
              />
            )}

            {/* Raffle Card */}
            <RaffleCard roundInfo={roundInfo} userTickets={userTickets} />

            {/* Error Messages */}
            {raffleError && (
              <div className="error-message">
                {raffleError}
              </div>
            )}

            {/* Ticket Purchase */}
            {roundInfo && (roundInfo.statusCode === 0 || roundInfo.statusCode === 1) && (
              <TicketPurchase
                roundInfo={roundInfo}
                userTickets={userTickets}
                buyTickets={buyTickets}
                loading={loading}
              />
            )}

            {/* Draw Controls */}
            <DrawControls
              roundInfo={roundInfo}
              requestDraw={requestDraw}
              executeDraw={executeDraw}
              canRequestDraw={canRequestDraw}
              canExecuteDraw={canExecuteDraw}
              loading={loading}
            />

            {/* Admin Panel */}
            <AdminPanel
              contract={contract}
              account={account}
              signer={signer}
            />
          </>
        ) : isConnected && !isCorrectNetwork ? (
          <div className="raffle-card" style={{ textAlign: 'center' }}>
            <h2>⚠️ Wrong Network</h2>
            <p style={{ margin: '20px 0', color: '#94a3b8' }}>
              Please switch to BSC Testnet to use this dApp
            </p>
            <button className="btn btn-primary" onClick={switchNetwork}>
              Switch Network
            </button>
          </div>
        ) : (
          <div className="raffle-card" style={{ textAlign: 'center' }}>
            <h2>Welcome to Blue Raffle!</h2>
            <p style={{ margin: '20px 0', color: '#94a3b8' }}>
              Connect your wallet to get started
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '40px' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Powered by Blockhash Randomness | BSC Testnet
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
