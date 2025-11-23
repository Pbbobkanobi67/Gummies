import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function RoundHistory({ contract, account }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const roundsPerPage = 10;

  useEffect(() => {
    if (contract) {
      loadRoundHistory();
    }
  }, [contract, page]);

  const loadRoundHistory = async () => {
    if (!contract) return;

    try {
      setLoading(true);

      const currentRoundId = await contract.currentRoundId();
      const total = Number(currentRoundId) - 1; // Exclude current round

      if (total <= 0) {
        setRounds([]);
        setLoading(false);
        return;
      }

      // Calculate which rounds to fetch for this page
      const startRound = Math.max(1, total - (page * roundsPerPage) + 1);
      const endRound = Math.min(total, total - ((page - 1) * roundsPerPage));

      const roundsData = [];

      for (let i = endRound; i >= startRound; i--) {
        try {
          const details = await contract.getRoundDetails(i);

          // Only show completed rounds
          if (Number(details.status) === 3) { // Complete
            const participants = await contract.getRoundParticipants(i);

            roundsData.push({
              roundId: i,
              winner: details.winner,
              prize: ethers.formatEther(details.winnerPrize),
              totalTickets: ethers.formatEther(details.totalTickets),
              participants: participants.length,
              isUserWinner: account && details.winner.toLowerCase() === account.toLowerCase(),
              randomSeed: details.randomSeed.toString(),
            });
          }
        } catch (err) {
          console.error(`Error loading round ${i}:`, err);
        }
      }

      setRounds(roundsData);
    } catch (err) {
      console.error('Error loading round history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && rounds.length === 0) {
    return (
      <div className="history-card">
        <h3>📜 Round History</h3>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading round history...</p>
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="history-card">
        <h3>📜 Round History</h3>
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
          No completed rounds yet. Be the first to play!
        </p>
      </div>
    );
  }

  return (
    <div className="history-card">
      <h3>📜 Round History</h3>

      <div className="round-history-list">
        {rounds.map((round) => (
          <div
            key={round.roundId}
            className={`history-item ${round.isUserWinner ? 'history-item-winner' : ''}`}
          >
            <div className="history-header">
              <div className="round-badge">Round #{round.roundId}</div>
              {round.isUserWinner && <div className="winner-badge">🏆 You Won!</div>}
            </div>

            <div className="history-details">
              <div className="history-row">
                <span className="history-label">Winner:</span>
                <span className="history-value history-address">
                  {round.winner.slice(0, 6)}...{round.winner.slice(-4)}
                </span>
              </div>

              <div className="history-row">
                <span className="history-label">Prize:</span>
                <span className="history-value history-prize">
                  {parseFloat(round.prize).toFixed(2)} BLUE
                </span>
              </div>

              <div className="history-row">
                <span className="history-label">Total Tickets:</span>
                <span className="history-value">{parseFloat(round.totalTickets).toFixed(0)}</span>
              </div>

              <div className="history-row">
                <span className="history-label">Participants:</span>
                <span className="history-value">{round.participants}</span>
              </div>

              <div className="history-row">
                <span className="history-label">Random Seed:</span>
                <span className="history-value history-seed">
                  {round.randomSeed.slice(0, 10)}...
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setPage(p => p + 1)}
          disabled={loading}
        >
          ← Older
        </button>
        <span style={{ margin: '0 20px', color: '#94a3b8' }}>Page {page}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Newer →
        </button>
      </div>
    </div>
  );
}
