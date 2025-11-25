import React from 'react';
import TargetDice from '../components/Progressive/TargetDice';
import JackpotDisplay from '../components/Progressive/JackpotDisplay';
import ProgressiveRoll from '../components/Progressive/ProgressiveRoll';

function ProgressivePage({ wallet, progressive }) {
  const isConnected = wallet.account && wallet.isCorrectNetwork;
  const isPaused = progressive.stats?.paused;
  const hasJackpot = progressive.stats && parseFloat(progressive.stats.jackpotPool) >= 5;
  const targetRevealed = progressive.targetDice?.isRevealed;

  const canPlay = isConnected && !isPaused && hasJackpot && targetRevealed;

  return (
    <div className="progressive-page">
      {/* Error Display */}
      {progressive.error && (
        <div className="error-banner">
          <p>{progressive.error}</p>
          <button onClick={progressive.clearError}>Dismiss</button>
        </div>
      )}

      {/* Status Warnings */}
      {!wallet.account && (
        <div className="warning-banner">
          Connect your wallet to play
        </div>
      )}

      {wallet.account && !wallet.isCorrectNetwork && (
        <div className="warning-banner">
          Please switch to BSC Testnet
        </div>
      )}

      {isPaused && (
        <div className="warning-banner paused">
          Game is currently paused
        </div>
      )}

      {!hasJackpot && !isPaused && (
        <div className="warning-banner">
          Jackpot needs funding before play can begin
        </div>
      )}

      {/* Jackpot Display */}
      <JackpotDisplay stats={progressive.stats} payouts={progressive.payouts} />

      {/* Main Game Area */}
      <div className="progressive-game-container">
        <div className="progressive-left">
          <TargetDice
            targetDice={progressive.targetDice}
            onSetTarget={progressive.setTargetDice}
            onRevealTarget={progressive.revealTargetDice}
            loading={progressive.loading}
          />
        </div>

        <div className="progressive-right">
          <ProgressiveRoll
            targetDice={progressive.targetDice}
            pendingRoll={progressive.pendingRoll}
            lastResult={progressive.lastResult}
            onBuyRoll={progressive.buyRoll}
            onRevealRoll={progressive.revealRoll}
            canRevealRoll={progressive.canRevealRoll}
            loading={progressive.loading}
            disabled={!canPlay}
            clearResult={progressive.clearResult}
            ticketPrice={progressive.stats?.ticketPrice}
          />
        </div>
      </div>

      {/* How to Play */}
      <div className="how-to-play">
        <h3>How to Play Progressive Dice</h3>
        <ol>
          <li><strong>Target Dice:</strong> 4 target dice are set for the round</li>
          <li><strong>Buy Roll:</strong> Pay 1 BLUE to roll 4 dice</li>
          <li><strong>Match:</strong> Try to match all 4 target dice (order doesn't matter)</li>
          <li><strong>Win:</strong> Match 4/4 for the jackpot, 3/4 or 2/4 for smaller prizes</li>
        </ol>

        <div className="payout-info">
          <h4>Payout Structure</h4>
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              <tr className="jackpot-row">
                <td>4/4 (Jackpot)</td>
                <td>80% of pot</td>
              </tr>
              <tr>
                <td>3/4</td>
                <td>1% of pot (min 5 BLUE)</td>
              </tr>
              <tr>
                <td>2/4</td>
                <td>1 BLUE refund</td>
              </tr>
              <tr>
                <td>0-1/4</td>
                <td>No payout (adds to pot)</td>
              </tr>
            </tbody>
          </table>

          <h4>On Jackpot Win</h4>
          <ul>
            <li>80% to winner</li>
            <li>10% seeds next jackpot</li>
            <li>3% to treasury</li>
            <li>2% to developer</li>
            <li>3% burned</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProgressivePage;
