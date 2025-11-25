import React from 'react';
import DiceDisplay from '../DiceGame/DiceDisplay';

function TargetDice({ targetDice, onSetTarget, onRevealTarget, loading }) {
  const isRevealed = targetDice?.isRevealed;
  const needsReveal = targetDice?.roundId > 0 && !isRevealed;

  return (
    <div className="target-dice-section">
      <h3>Target Dice - Round #{targetDice?.roundId || 0}</h3>

      <div className="target-dice-display">
        {isRevealed ? (
          <div className="dice-row-4">
            <DiceDisplay value={targetDice.die1} size="small" />
            <DiceDisplay value={targetDice.die2} size="small" />
            <DiceDisplay value={targetDice.die3} size="small" />
            <DiceDisplay value={targetDice.die4} size="small" />
          </div>
        ) : (
          <div className="dice-row-4 unrevealed">
            <div className="dice-placeholder">?</div>
            <div className="dice-placeholder">?</div>
            <div className="dice-placeholder">?</div>
            <div className="dice-placeholder">?</div>
          </div>
        )}
      </div>

      <div className="target-actions">
        {!targetDice?.roundId || isRevealed ? (
          <button
            className="btn btn-secondary"
            onClick={onSetTarget}
            disabled={loading}
          >
            {loading ? 'Setting...' : 'Set New Target Dice'}
          </button>
        ) : needsReveal ? (
          <button
            className="btn btn-primary"
            onClick={onRevealTarget}
            disabled={loading}
          >
            {loading ? 'Revealing...' : 'Reveal Target Dice'}
          </button>
        ) : null}
      </div>

      {isRevealed && (
        <p className="target-hint">
          Match all 4 dice to win the jackpot!
        </p>
      )}
    </div>
  );
}

export default TargetDice;
