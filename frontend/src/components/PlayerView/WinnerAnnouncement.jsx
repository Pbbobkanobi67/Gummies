import React from 'react';

export function WinnerAnnouncement({ winner, onPlayAgain, onViewRound }) {
  if (!winner) return null;

  return (
    <div className="winner-announcement">
      <h2>🎉 We Have a Winner! 🎉</h2>

      <div className="winner-address">
        {winner.winner}
      </div>

      <div className="winner-prize">
        Prize: {parseFloat(winner.prize).toFixed(2)} BLUE
      </div>

      <div style={{ marginTop: '30px' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
          Round #{winner.roundId} has ended
        </p>

        <div className="play-again-prompt">
          <h3>Ready for the next round?</h3>
          <button className="btn btn-success" onClick={onPlayAgain}>
            Play Again! 🎰
          </button>
          <button className="btn btn-secondary" onClick={onViewRound}>
            View Round Details
          </button>
        </div>
      </div>
    </div>
  );
}
