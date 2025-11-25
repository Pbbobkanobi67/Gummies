import React, { useState, useEffect } from 'react';
import { RaffleCard } from '../components/PlayerView/RaffleCard';
import { TicketPurchase } from '../components/PlayerView/TicketPurchase';
import { WinnerAnnouncement } from '../components/PlayerView/WinnerAnnouncement';
import { DrawControls } from '../components/PlayerView/DrawControls';
import { ActionBanner } from '../components/PlayerView/ActionBanner';

export function HomePage({
  contract,
  roundInfo,
  userTickets,
  loading,
  error,
  buyTickets,
  requestDraw,
  executeDraw,
  canRequestDraw,
  canExecuteDraw,
  getPreviousRoundWinner,
  isConnected,
  isCorrectNetwork,
  signer,
}) {
  const [previousWinner, setPreviousWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);

  // Check for previous round winner (only show once per round)
  useEffect(() => {
    const checkPreviousWinner = async () => {
      if (roundInfo && roundInfo.roundId && parseInt(roundInfo.roundId) > 1) {
        const prevRoundId = parseInt(roundInfo.roundId) - 1;

        // Check localStorage to see if we've shown this winner already
        const shownWinners = JSON.parse(localStorage.getItem('shownWinners') || '[]');

        // Only show if we haven't shown this round's winner yet
        if (!shownWinners.includes(prevRoundId)) {
          const winner = await getPreviousRoundWinner();
          if (winner && winner.winner !== '0x0000000000000000000000000000000000000000') {
            setPreviousWinner(winner);
            setShowWinner(true);

            // Mark this winner as shown in localStorage
            shownWinners.push(prevRoundId);
            localStorage.setItem('shownWinners', JSON.stringify(shownWinners));
          }
        }
      }
    };

    checkPreviousWinner();
  }, [roundInfo?.roundId, getPreviousRoundWinner]);

  const handlePlayAgain = () => {
    setShowWinner(false);
    setPreviousWinner(null);
  };

  const handleViewRound = () => {
    setShowWinner(false);
  };

  if (!isConnected || !isCorrectNetwork) {
    return (
      <div className="raffle-card" style={{ textAlign: 'center' }}>
        <h2>Welcome to Blue Raffle!</h2>
        <p style={{ margin: '20px 0', color: '#94a3b8' }}>
          {!isConnected
            ? 'Connect your wallet to get started'
            : 'Please switch to BSC Testnet to use this dApp'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Winner Announcement - Shows only once per round */}
      {showWinner && previousWinner && (
        <WinnerAnnouncement
          winner={previousWinner}
          onPlayAgain={handlePlayAgain}
          onViewRound={handleViewRound}
        />
      )}

      {/* Action Required Banner */}
      <ActionBanner
        roundInfo={roundInfo}
        canRequestDraw={canRequestDraw}
        canExecuteDraw={canExecuteDraw}
        requestDraw={requestDraw}
        executeDraw={executeDraw}
        loading={loading}
      />

      {/* Raffle Card */}
      <RaffleCard roundInfo={roundInfo} userTickets={userTickets} />

      {/* Error Messages */}
      {error && (
        <div className="error-message">
          {error}
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
        contract={contract}
        signer={signer}
      />
    </>
  );
}
