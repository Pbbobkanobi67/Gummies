import React from 'react';
import BetControls from '../components/DiceGame/BetControls';
import RollControls from '../components/DiceGame/RollControls';
import GameStats from '../components/DiceGame/GameStats';

function HomePage({ wallet, dice }) {
  const isConnected = wallet.account && wallet.isCorrectNetwork;
  const isPaused = dice.limits?.paused;
  const hasInsufficientBankroll = dice.stats && parseFloat(dice.stats.houseBankroll) < parseFloat(dice.limits?.minBet || 5) * 6;

  // Determine if betting is disabled
  const bettingDisabled = !isConnected || isPaused || hasInsufficientBankroll || dice.pendingBet;

  return (
    <div className="home-page">
      {/* Error Display */}
      {dice.error && (
        <div className="error-banner">
          <p>{dice.error}</p>
          <button onClick={dice.clearError}>Dismiss</button>
        </div>
      )}

      {/* Status Warnings */}
      {!wallet.account && (
        <div className="warning-banner">
          Connect your wallet to start playing
        </div>
      )}

      {wallet.account && !wallet.isCorrectNetwork && (
        <div className="warning-banner">
          Please switch to BSC Testnet to play
        </div>
      )}

      {isPaused && (
        <div className="warning-banner paused">
          Game is currently paused by admin
        </div>
      )}

      {hasInsufficientBankroll && !isPaused && (
        <div className="warning-banner">
          House bankroll is too low. Betting temporarily unavailable.
        </div>
      )}

      {/* Main Game Area */}
      <div className="game-container">
        <div className="game-left">
          <RollControls
            pendingBet={dice.pendingBet}
            lastResult={dice.lastResult}
            onRoll={dice.rollDice}
            onCancel={dice.cancelBet}
            canRoll={dice.canRoll}
            loading={dice.loading}
            clearResult={dice.clearResult}
          />
        </div>

        <div className="game-right">
          <BetControls
            limits={dice.limits}
            onPlaceBet={dice.placeBet}
            calculatePayout={dice.calculatePayout}
            loading={dice.loading}
            disabled={bettingDisabled}
          />
        </div>
      </div>

      {/* Game Stats */}
      <GameStats stats={dice.stats} limits={dice.limits} />

      {/* How to Play */}
      <div className="how-to-play">
        <h3>How to Play</h3>
        <ol>
          <li><strong>Connect Wallet:</strong> Connect your MetaMask wallet to BSC Testnet</li>
          <li><strong>Choose Bet Type:</strong> Select from Exact, Over, Under, Odd, or Even</li>
          <li><strong>Set Amount:</strong> Enter your bet amount in BLUE tokens</li>
          <li><strong>Place Bet:</strong> Approve tokens and place your bet</li>
          <li><strong>Wait:</strong> Wait ~6 seconds for block confirmation</li>
          <li><strong>Roll:</strong> Click Roll Dice to reveal your result!</li>
        </ol>

        <div className="bet-types-info">
          <h4>Bet Types & Payouts</h4>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Exact</td>
                <td>Guess the exact number (1-6)</td>
                <td>5.82x</td>
              </tr>
              <tr>
                <td>Odd</td>
                <td>Roll 1, 3, or 5</td>
                <td>1.94x</td>
              </tr>
              <tr>
                <td>Even</td>
                <td>Roll 2, 4, or 6</td>
                <td>1.94x</td>
              </tr>
              <tr>
                <td>Over</td>
                <td>Roll higher than chosen number</td>
                <td>Variable</td>
              </tr>
              <tr>
                <td>Under</td>
                <td>Roll lower than chosen number</td>
                <td>Variable</td>
              </tr>
            </tbody>
          </table>
          <p className="house-edge-note">House edge: 3% (2% to treasury, 1% burned)</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
