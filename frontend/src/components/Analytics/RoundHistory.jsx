import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const STATUS_NAMES = {
  0: 'Waiting',
  1: 'Active',
  2: 'Drawing',
  3: 'Complete',
  4: 'Cancelled',
};

export function RoundHistory({ contract, account }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [debugInfo, setDebugInfo] = useState(null);
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
      console.log('🔍 RoundHistory: Starting to load round history...');

      const currentRoundId = await contract.currentRoundId();
      const currentRoundNum = Number(currentRoundId);
      const total = currentRoundNum - 1; // Exclude current round

      console.log(`📊 RoundHistory: Current round is #${currentRoundNum}, checking ${total} completed rounds`);

      if (total <= 0) {
        console.log('⚠️ RoundHistory: No completed rounds found');
        setRounds([]);
        setDebugInfo('No completed rounds yet (current round is #1)');
        setLoading(false);
        return;
      }

      // Calculate which rounds to fetch for this page
      const startRound = Math.max(1, total - (page * roundsPerPage) + 1);
      const endRound = Math.min(total, total - ((page - 1) * roundsPerPage));

      console.log(`📄 RoundHistory: Page ${page} - Checking rounds ${startRound} to ${endRound}`);

      const roundsData = [];
      const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      const errors = [];

      for (let i = endRound; i >= startRound; i--) {
        try {
          console.log(`🔎 RoundHistory: Fetching round #${i}...`);
          const details = await contract.getRoundDetails(i);

          const status = Number(details.status);
          const statusName = STATUS_NAMES[status] || 'Unknown';
          statusCounts[status]++;

          console.log(`  ✓ Round #${i}: Status=${status} (${statusName}), Winner=${details.winner}, Prize=${ethers.formatEther(details.winnerPrize)} BLUE`);

          // Show completed rounds (status 3) AND cancelled rounds with winners (status 4)
          if (status === 3 || (status === 4 && details.winner !== ethers.ZeroAddress)) {
            // Try to get participants, but don't fail if it errors
            let participantCount = 0;
            try {
              const participants = await contract.getRoundParticipants(i);
              participantCount = participants.length;
              console.log(`  ✓ Round #${i}: ${participantCount} participants`);
            } catch (participantErr) {
              console.warn(`  ⚠️ Round #${i}: Could not fetch participants (${participantErr.message}), using 0`);
              participantCount = 0; // Fallback to 0 if getRoundParticipants fails
            }

            roundsData.push({
              roundId: i,
              winner: details.winner,
              prize: ethers.formatEther(details.winnerPrize),
              totalTickets: ethers.formatEther(details.totalTickets),
              participants: participantCount,
              isUserWinner: account && details.winner.toLowerCase() === account.toLowerCase(),
              randomSeed: details.randomSeed.toString(),
              status: statusName,
              isCancelled: status === 4,
            });
          } else {
            console.log(`  ⊘ Round #${i}: Skipped (status ${status} - ${statusName})`);
          }
        } catch (err) {
          const errorMsg = `Round #${i}: ${err.message}`;
          console.error(`❌ RoundHistory: Error loading ${errorMsg}`, err);
          errors.push(errorMsg);
        }
      }

      console.log(`📊 RoundHistory: Status breakdown:`, statusCounts);
      console.log(`✅ RoundHistory: Loaded ${roundsData.length} displayable rounds`);

      if (errors.length > 0) {
        console.warn(`⚠️ RoundHistory: ${errors.length} errors occurred:`, errors);
      }

      // Set debug info
      const debugMsg = `Scanned rounds ${startRound}-${endRound}. Status counts: ${Object.entries(statusCounts).map(([s, c]) => `${STATUS_NAMES[s]}=${c}`).join(', ')}. Found ${roundsData.length} displayable rounds.${errors.length > 0 ? ` Errors: ${errors.length}` : ''}`;
      setDebugInfo(debugMsg);

      setRounds(roundsData);
    } catch (err) {
      console.error('❌ RoundHistory: Error loading round history:', err);
      setDebugInfo(`Error: ${err.message}`);
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
          {debugInfo && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
              {debugInfo}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="history-card">
        <h3>📜 Round History</h3>
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
          No completed rounds found.
        </p>
        {debugInfo && (
          <div style={{
            padding: '15px',
            background: 'rgba(100, 116, 139, 0.1)',
            borderRadius: '8px',
            marginTop: '20px',
            fontSize: '0.85rem',
            color: '#94a3b8'
          }}>
            <strong>Debug Info:</strong><br />
            {debugInfo}
            <br /><br />
            <em>Check browser console for detailed logs</em>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="history-card">
      <h3>📜 Round History</h3>

      {debugInfo && (
        <div style={{
          padding: '10px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '0.8rem',
          color: '#86efac'
        }}>
          {debugInfo}
        </div>
      )}

      <div className="round-history-list">
        {rounds.map((round) => (
          <div
            key={round.roundId}
            className={`history-item ${round.isUserWinner ? 'history-item-winner' : ''} ${round.isCancelled ? 'history-item-cancelled' : ''}`}
          >
            <div className="history-header">
              <div className="round-badge">
                Round #{round.roundId}
                {round.isCancelled && <span style={{ marginLeft: '8px', fontSize: '0.85em' }}>(Cancelled)</span>}
              </div>
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
                <span className="history-value">
                  {round.participants > 0 ? round.participants : 'N/A'}
                </span>
              </div>

              <div className="history-row">
                <span className="history-label">Random Seed:</span>
                <span className="history-value history-seed">
                  {round.randomSeed.slice(0, 10)}...
                </span>
              </div>

              <div className="history-row">
                <span className="history-label">Status:</span>
                <span className="history-value">
                  {round.status}
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
