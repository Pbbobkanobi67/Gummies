import React, { useState, useEffect } from 'react';
import DiceDisplay from '../DiceGame/DiceDisplay';

function ProgressiveRoll({
  targetDice,
  pendingRoll,
  lastResult,
  onBuyRoll,
  onRevealRoll,
  canRevealRoll,
  loading,
  disabled,
  clearResult,
  ticketPrice
}) {
  const [rollStatus, setRollStatus] = useState({ canReveal: false, reason: '' });
  const [rolling, setRolling] = useState(false);

  // Check if we can reveal
  useEffect(() => {
    if (!pendingRoll) {
      setRollStatus({ canReveal: false, reason: '' });
      return;
    }

    const checkStatus = async () => {
      const status = await canRevealRoll(pendingRoll.id);
      setRollStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [pendingRoll, canRevealRoll]);

  const handleReveal = async () => {
    if (!pendingRoll || !rollStatus.canReveal) return;
    setRolling(true);
    await onRevealRoll(pendingRoll.id);
    setRolling(false);
  };

  // Show result
  if (lastResult) {
    const getResultMessage = () => {
      if (lastResult.isJackpot) return 'JACKPOT!!!';
      if (lastResult.matches === 3) return '3 Matches!';
      if (lastResult.matches === 2) return '2 Matches!';
      return 'No Match';
    };

    const getResultClass = () => {
      if (lastResult.isJackpot) return 'result-jackpot';
      if (lastResult.matches >= 2) return 'result-win';
      return 'result-loss';
    };

    return (
      <div className={`progressive-result ${getResultClass()}`}>
        <h3>{getResultMessage()}</h3>

        <div className="result-dice">
          <p className="dice-label">Your Roll:</p>
          <div className="dice-row-4">
            {lastResult.rolledDice.map((die, i) => (
              <DiceDisplay key={i} value={die} size="small" />
            ))}
          </div>
        </div>

        <div className="result-comparison">
          <p className="dice-label">Target:</p>
          <div className="dice-row-4">
            <DiceDisplay value={targetDice?.die1} size="small" />
            <DiceDisplay value={targetDice?.die2} size="small" />
            <DiceDisplay value={targetDice?.die3} size="small" />
            <DiceDisplay value={targetDice?.die4} size="small" />
          </div>
        </div>

        <div className="result-payout">
          <span className="matches">{lastResult.matches}/4 Matches</span>
          {parseFloat(lastResult.payout) > 0 && (
            <span className="payout-amount">+{lastResult.payout} BLUE</span>
          )}
        </div>

        <button className="btn btn-primary" onClick={clearResult}>
          Play Again
        </button>
      </div>
    );
  }

  // Pending roll - waiting to reveal
  if (pendingRoll) {
    return (
      <div className="progressive-roll pending">
        <h3>Roll Purchased!</h3>

        <div className="dice-row-4 rolling-dice">
          <DiceDisplay rolling={rolling} size="small" />
          <DiceDisplay rolling={rolling} size="small" />
          <DiceDisplay rolling={rolling} size="small" />
          <DiceDisplay rolling={rolling} size="small" />
        </div>

        {!rollStatus.canReveal ? (
          <div className="waiting-message">
            <p>Waiting for blocks to confirm...</p>
            <p className="status-reason">{rollStatus.reason}</p>
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-large"
          onClick={handleReveal}
          disabled={!rollStatus.canReveal || loading || rolling}
        >
          {rolling ? 'Rolling...' : loading ? 'Processing...' : 'Reveal Roll!'}
        </button>
      </div>
    );
  }

  // Ready to buy
  return (
    <div className="progressive-roll ready">
      <h3>Try Your Luck!</h3>

      <p className="roll-cost">
        Cost: <strong>{ticketPrice || '1'} BLUE</strong> per roll
      </p>

      <button
        className="btn btn-primary btn-large"
        onClick={onBuyRoll}
        disabled={disabled || loading}
      >
        {loading ? 'Processing...' : 'Buy Roll'}
      </button>

      <p className="roll-hint">
        Match all 4 dice to win the jackpot!
      </p>
    </div>
  );
}

export default ProgressiveRoll;
