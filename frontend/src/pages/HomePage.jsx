import React, { useState, useEffect, useRef } from 'react';
import { RaffleCard } from '../components/PlayerView/RaffleCard';
import { TicketPurchase } from '../components/PlayerView/TicketPurchase';
import { WinnerAnnouncement } from '../components/PlayerView/WinnerAnnouncement';
import { DrawControls } from '../components/PlayerView/DrawControls';

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
}) {
  const [previousWinner, setPreviousWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const shownWinnersRef = useRef(new Set());

  // Check for previous round winner (only show once per round)
  useEffect(() => {
    const checkPreviousWinner = async () => {
      if (roundInfo && roundInfo.roundId && parseInt(roundInfo.roundId) > 1) {
        const prevRoundId = parseInt(roundInfo.roundId) - 1;

        // Only show if we haven't shown this round's winner yet
        if (!shownWinnersRef.current.has(prevRoundId)) {
          const winner = await getPreviousRoundWinner();
          if (winner && winner.winner !== '0x0000000000000000000000000000000000000000') {
            setPreviousWinner(winner);
            setShowWinner(true);
            shownWinnersRef.current.add(prevRoundId);
          }
        }
      }
    };

    checkPreviousWinner();
  }, [roundInfo?.roundId]); // Removed getPreviousRoundWinner to prevent infinite re-renders

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
      />
    </>
  );
}
