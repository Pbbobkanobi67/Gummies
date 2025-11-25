import React, { useState, useEffect } from 'react';
import { BetTypeLabels } from '../../hooks/useDice';
import DiceDisplay from './DiceDisplay';

function RollControls({
  pendingBet,
  lastResult,
  onRoll,
  onCancel,
  canRoll,
  loading,
  clearResult
}) {
  const [rollStatus, setRollStatus] = useState({ canExecute: false, reason: '' });
  const [rolling, setRolling] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Check if we can roll
  useEffect(() => {
    if (!pendingBet) {
      setRollStatus({ canExecute: false, reason: '' });
      return;
    }

    const checkRollStatus = async () => {
      const status = await canRoll(pendingBet.id);
      setRollStatus(status);

      // If too early, start countdown
      if (!status.canExecute && status.reason === 'Too early to roll') {
        setCountdown(2); // Wait for 2 blocks (~6 seconds)
      } else {
        setCountdown(null);
      }
    };

    checkRollStatus();
    const interval = setInterval(checkRollStatus, 3000);
    return () => clearInterval(interval);
  }, [pendingBet, canRoll]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRoll = async () => {
    if (!pendingBet || !rollStatus.canExecute) return;

    setRolling(true);
    await onRoll(pendingBet.id);
    setRolling(false);
  };

  // Show result screen
  if (lastResult) {
    return (
      <div className="roll-result">
        <h3>{lastResult.won ? 'You Won!' : 'You Lost'}</h3>
        <DiceDisplay value={lastResult.rolledNumber} size="large" />
        <div className="result-details">
          <p className="rolled-number">Rolled: {lastResult.rolledNumber}</p>
          {lastResult.won ? (
            <p className="win-amount">+{lastResult.payout} BLUE</p>
          ) : (
            <p className="loss-amount">Better luck next time!</p>
          )}
        </div>
        <button className="btn btn-primary" onClick={clearResult}>
          Play Again
        </button>
      </div>
    );
  }

  // Show pending bet / roll screen
  if (pendingBet) {
    return (
      <div className="roll-controls">
        <h3>Bet Placed!</h3>

        <DiceDisplay rolling={rolling} size="large" />

        <div className="pending-bet-info">
          <p><strong>Bet:</strong> {pendingBet.amount} BLUE on {BetTypeLabels[pendingBet.betType]}</p>
          {pendingBet.betType <= 2 && (
            <p><strong>Number:</strong> {pendingBet.chosenNumber}</p>
          )}
        </div>

        {countdown !== null && countdown > 0 ? (
          <div className="waiting-message">
            <p>Waiting for blocks to confirm...</p>
            <p className="countdown">Ready in ~{countdown * 3} seconds</p>
          </div>
        ) : !rollStatus.canExecute ? (
          <div className="status-message">
            <p>{rollStatus.reason}</p>
          </div>
        ) : null}

        <div className="roll-buttons">
          <button
            className="btn btn-primary btn-large"
            onClick={handleRoll}
            disabled={!rollStatus.canExecute || loading || rolling}
          >
            {rolling ? 'Rolling...' : loading ? 'Processing...' : 'Roll Dice!'}
          </button>

          {!rollStatus.canExecute && rollStatus.reason === 'Too early to roll' && (
            <button
              className="btn btn-secondary"
              onClick={() => onCancel(pendingBet.id)}
              disabled={loading}
            >
              Cancel Bet
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default - waiting for bet
  return (
    <div className="roll-controls waiting">
      <DiceDisplay value={1} size="large" />
      <p className="waiting-text">Place a bet to start playing!</p>
    </div>
  );
}

export default RollControls;
