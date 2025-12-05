import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Symbol definitions
const SYMBOLS = {
  0: { name: 'BLUE', emoji: '🔵', color: '#3B82F6' },
  1: { name: 'DIAMOND', emoji: '💎', color: '#A855F7' },
  2: { name: 'FIRE', emoji: '🔥', color: '#EF4444' },
  3: { name: 'STAR', emoji: '⭐', color: '#FBBF24' },
  4: { name: 'LUCKY', emoji: '🍀', color: '#22C55E' },
  5: { name: 'SEVEN', emoji: '🎰', color: '#EC4899' }
};

// Payout multipliers (for display)
const PAYOUTS = {
  TRIPLE_BLUE: '50x',
  TRIPLE_DIAMOND: '25x',
  TRIPLE_SEVEN: '15x',
  TRIPLE_FIRE: '10x',
  TRIPLE_LUCKY: '8x',
  TRIPLE_STAR: '5x',
  TWO_MATCH: '1.5x'
};

// Bet presets
const BET_PRESETS = [5, 10, 25, 50, 100];

export function SlotsPage({ contract, signer, isConnected, isCorrectNetwork }) {
  // State
  const [betAmount, setBetAmount] = useState(25);
  const [customBet, setCustomBet] = useState('');
  const [balance, setBalance] = useState('0');
  const [reels, setReels] = useState([3, 3, 3]); // Default to stars
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(null);
  const [lastWin, setLastWin] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSpins: 0,
    totalWagered: '0',
    totalWon: '0',
    biggestWin: '0'
  });

  // Animation state
  const [animatingReels, setAnimatingReels] = useState([false, false, false]);

  // Placeholder for when contract not deployed
  const isContractReady = false; // Set to true when BlueSlots is deployed

  // Fetch balance (placeholder)
  useEffect(() => {
    // TODO: Fetch BLUE balance when contract is ready
    setBalance('1,000');
  }, [signer]);

  // Spin animation
  const animateSpin = useCallback(() => {
    return new Promise((resolve) => {
      // Start all reels spinning
      setAnimatingReels([true, true, true]);

      // Random symbols during animation
      const interval = setInterval(() => {
        setReels([
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 6)
        ]);
      }, 100);

      // Stop reels one by one
      setTimeout(() => {
        setAnimatingReels([false, true, true]);
      }, 1000);

      setTimeout(() => {
        setAnimatingReels([false, false, true]);
      }, 1500);

      setTimeout(() => {
        clearInterval(interval);
        setAnimatingReels([false, false, false]);
        resolve();
      }, 2000);
    });
  }, []);

  // Handle spin (demo mode)
  const handleSpin = async () => {
    if (!isContractReady) {
      // Demo mode - random result
      setError(null);
      setLastWin(null);
      setIsSpinning(true);

      await animateSpin();

      // Generate random result
      const finalReels = [
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6)
      ];
      setReels(finalReels);

      // Check for win
      const win = checkWin(finalReels);
      if (win > 0) {
        setLastWin(win);
      }

      setIsSpinning(false);
      return;
    }

    // Real contract interaction (when ready)
    try {
      setError(null);
      setLastWin(null);
      setIsSpinning(true);

      // TODO: Call contract.spin(betAmount)

    } catch (err) {
      console.error('Spin error:', err);
      setError(err.message);
      setIsSpinning(false);
    }
  };

  // Check win (demo)
  const checkWin = (symbols) => {
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      // Triple match
      const multipliers = [50, 25, 10, 5, 8, 15];
      return betAmount * multipliers[symbols[0]];
    }
    if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
      // Two match
      return betAmount * 1.5;
    }
    return 0;
  };

  // Get result message
  const getResultMessage = () => {
    if (isSpinning) return 'Spinning...';
    if (lastWin && lastWin > 0) {
      if (lastWin >= betAmount * 10) return 'JACKPOT!';
      if (lastWin >= betAmount * 5) return 'BIG WIN!';
      return 'Winner!';
    }
    return 'Spin to play!';
  };

  return (
    <div className="slots-page">
      {/* Demo Banner */}
      {!isContractReady && (
        <div className="demo-banner">
          Demo Mode - Contract not yet deployed
        </div>
      )}

      {/* Header */}
      <div className="slots-header">
        <div className="slots-title">
          <span className="slots-icon">🎰</span>
          <div>
            <h2>Blue Slots</h2>
            <p>Provably Fair | 3-Reel Classic</p>
          </div>
        </div>
        <div className="slots-balance">
          <span className="balance-label">Balance</span>
          <span className="balance-value">{balance} BLUE</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="slots-game">
        {/* Slot Machine */}
        <div className="slot-machine">
          <div className="reels-container">
            {reels.map((symbol, index) => (
              <div
                key={index}
                className={`reel ${animatingReels[index] ? 'spinning' : ''}`}
              >
                <div className="reel-symbol" style={{ color: SYMBOLS[symbol].color }}>
                  {SYMBOLS[symbol].emoji}
                </div>
              </div>
            ))}
          </div>

          {/* Payline indicator */}
          <div className="payline-indicator">
            <span className="payline-arrow">→</span>
            <span className="payline-text">PAYLINE</span>
            <span className="payline-arrow">←</span>
          </div>
        </div>

        {/* Result Message */}
        <div className={`result-message ${lastWin ? 'win' : ''}`}>
          {getResultMessage()}
          {lastWin > 0 && (
            <div className="win-amount">+{lastWin} BLUE</div>
          )}
        </div>

        {/* Bet Selection */}
        <div className="bet-section">
          <h3>Select Bet</h3>
          <div className="bet-presets">
            {BET_PRESETS.map((preset) => (
              <button
                key={preset}
                className={`bet-btn ${betAmount === preset ? 'selected' : ''}`}
                onClick={() => {
                  setBetAmount(preset);
                  setCustomBet('');
                }}
                disabled={isSpinning}
              >
                {preset}
              </button>
            ))}
            <input
              type="number"
              className="custom-bet-input"
              placeholder="Custom"
              value={customBet}
              onChange={(e) => {
                setCustomBet(e.target.value);
                const val = parseInt(e.target.value);
                if (val >= 5 && val <= 100) {
                  setBetAmount(val);
                }
              }}
              disabled={isSpinning}
            />
          </div>
          <div className="current-bet">
            Current Bet: <strong>{betAmount} BLUE</strong>
          </div>
        </div>

        {/* Spin Button */}
        <button
          className={`spin-btn ${isSpinning ? 'spinning' : ''}`}
          onClick={handleSpin}
          disabled={isSpinning || (!isContractReady && false)}
        >
          {isSpinning ? (
            <>Spinning...</>
          ) : (
            <>🎰 SPIN - {betAmount} BLUE</>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Info Panels */}
      <div className="slots-info-grid">
        {/* Payouts */}
        <div className="info-panel payouts-panel">
          <h3>Payouts</h3>
          <div className="payout-list">
            <div className="payout-row jackpot">
              <span>🔵🔵🔵</span>
              <span>{PAYOUTS.TRIPLE_BLUE}</span>
            </div>
            <div className="payout-row">
              <span>💎💎💎</span>
              <span>{PAYOUTS.TRIPLE_DIAMOND}</span>
            </div>
            <div className="payout-row">
              <span>🎰🎰🎰</span>
              <span>{PAYOUTS.TRIPLE_SEVEN}</span>
            </div>
            <div className="payout-row">
              <span>🔥🔥🔥</span>
              <span>{PAYOUTS.TRIPLE_FIRE}</span>
            </div>
            <div className="payout-row">
              <span>🍀🍀🍀</span>
              <span>{PAYOUTS.TRIPLE_LUCKY}</span>
            </div>
            <div className="payout-row">
              <span>⭐⭐⭐</span>
              <span>{PAYOUTS.TRIPLE_STAR}</span>
            </div>
            <div className="payout-row">
              <span>XX_</span>
              <span>{PAYOUTS.TWO_MATCH}</span>
            </div>
          </div>
        </div>

        {/* Your Stats */}
        <div className="info-panel stats-panel">
          <h3>Your Stats</h3>
          <div className="stats-list">
            <div className="stat-row">
              <span>Total Spins</span>
              <span>{stats.totalSpins}</span>
            </div>
            <div className="stat-row">
              <span>Total Wagered</span>
              <span>{stats.totalWagered} BLUE</span>
            </div>
            <div className="stat-row">
              <span>Total Won</span>
              <span>{stats.totalWon} BLUE</span>
            </div>
            <div className="stat-row highlight">
              <span>Biggest Win</span>
              <span>{stats.biggestWin} BLUE</span>
            </div>
          </div>
        </div>

        {/* Potential Wins */}
        <div className="info-panel potential-panel">
          <h3>With {betAmount} BLUE Bet</h3>
          <div className="potential-list">
            <div className="potential-row jackpot">
              <span>🔵🔵🔵 Jackpot</span>
              <span>{betAmount * 50} BLUE</span>
            </div>
            <div className="potential-row">
              <span>💎💎💎 Diamond</span>
              <span>{betAmount * 25} BLUE</span>
            </div>
            <div className="potential-row">
              <span>🎰🎰🎰 Seven</span>
              <span>{betAmount * 15} BLUE</span>
            </div>
            <div className="potential-row">
              <span>2-Match</span>
              <span>{betAmount * 1.5} BLUE</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .slots-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .demo-banner {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .slots-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .slots-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slots-icon {
          font-size: 2.5rem;
        }

        .slots-title h2 {
          margin: 0;
          color: #f8fafc;
          font-size: 1.5rem;
        }

        .slots-title p {
          margin: 0;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .slots-balance {
          text-align: right;
        }

        .balance-label {
          display: block;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .balance-value {
          color: #3b82f6;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .slots-game {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 20px;
        }

        .slot-machine {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-radius: 16px;
          padding: 30px;
          border: 3px solid #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }

        .reels-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .reel {
          width: 100px;
          height: 100px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-radius: 12px;
          border: 2px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .reel.spinning {
          animation: reelSpin 0.1s infinite;
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes reelSpin {
          0%, 100% { transform: translateY(-2px); }
          50% { transform: translateY(2px); }
        }

        .reel-symbol {
          font-size: 3rem;
          text-shadow: 0 0 10px currentColor;
        }

        .payline-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #fbbf24;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .payline-arrow {
          animation: arrowPulse 1s ease-in-out infinite;
        }

        @keyframes arrowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .result-message {
          text-align: center;
          margin: 20px 0;
          font-size: 1.5rem;
          color: #94a3b8;
          min-height: 60px;
        }

        .result-message.win {
          color: #22c55e;
          animation: winPulse 0.5s ease-in-out infinite;
        }

        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .win-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #fbbf24;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .bet-section {
          margin: 20px 0;
          text-align: center;
        }

        .bet-section h3 {
          color: #f8fafc;
          margin-bottom: 10px;
        }

        .bet-presets {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .bet-btn {
          padding: 10px 20px;
          background: #334155;
          border: 2px solid #475569;
          border-radius: 8px;
          color: #f8fafc;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bet-btn:hover:not(:disabled) {
          background: #475569;
          border-color: #3b82f6;
        }

        .bet-btn.selected {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .bet-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .custom-bet-input {
          width: 80px;
          padding: 10px;
          background: #334155;
          border: 2px solid #475569;
          border-radius: 8px;
          color: #f8fafc;
          text-align: center;
          font-weight: 600;
        }

        .custom-bet-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .current-bet {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .current-bet strong {
          color: #3b82f6;
        }

        .spin-btn {
          width: 100%;
          max-width: 300px;
          padding: 16px 32px;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: block;
          margin: 20px auto 0;
        }

        .spin-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .spin-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin-btn.spinning {
          animation: spinBtnPulse 0.5s ease-in-out infinite;
        }

        @keyframes spinBtnPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
          text-align: center;
        }

        .slots-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-panel {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 20px;
        }

        .info-panel h3 {
          color: #f8fafc;
          margin: 0 0 15px 0;
          font-size: 1rem;
          border-bottom: 1px solid #334155;
          padding-bottom: 10px;
        }

        .payout-list, .stats-list, .potential-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .payout-row, .stat-row, .potential-row {
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .payout-row.jackpot, .potential-row.jackpot {
          color: #fbbf24;
          font-weight: 600;
        }

        .stat-row.highlight {
          color: #22c55e;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .slots-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .slots-balance {
            text-align: center;
          }

          .reel {
            width: 80px;
            height: 80px;
          }

          .reel-symbol {
            font-size: 2.5rem;
          }

          .bet-presets {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
