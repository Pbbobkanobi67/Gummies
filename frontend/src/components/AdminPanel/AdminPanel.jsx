import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useGameContext } from '../../contexts/GameContext';

function AdminPanel({ dice, progressive, raffle, account }) {
  const [isOwner, setIsOwner] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newMinBet, setNewMinBet] = useState('');
  const [newMaxBet, setNewMaxBet] = useState('');
  const [newMaxPayout, setNewMaxPayout] = useState('');
  const [jackpotFundAmount, setJackpotFundAmount] = useState('');
  const [bonusMultiplier, setBonusMultiplier] = useState('1');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const checkOwner = async () => {
      if (dice.contract && account) {
        try {
          const owner = await dice.contract.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (err) {
          console.error('Error checking owner:', err);
        }
      }
    };
    checkOwner();
  }, [dice.contract, account]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFundHouse = async (e) => {
    e.preventDefault();
    if (!fundAmount) return;

    const success = await dice.fundHouse(fundAmount);
    if (success) {
      showMessage(`Successfully funded ${fundAmount} BLUE to house bankroll`, 'success');
      setFundAmount('');
    } else {
      showMessage(dice.error || 'Failed to fund house', 'error');
    }
  };

  const handleFundJackpot = async (e) => {
    e.preventDefault();
    if (!jackpotFundAmount || !progressive) return;

    const success = await progressive.fundJackpot(jackpotFundAmount);
    if (success) {
      showMessage(`Successfully funded ${jackpotFundAmount} BLUE to jackpot pool`, 'success');
      setJackpotFundAmount('');
    } else {
      showMessage(progressive.error || 'Failed to fund jackpot', 'error');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || !dice.contract) return;

    try {
      const tx = await dice.contract.withdrawHouse(
        ethers.parseEther(withdrawAmount)
      );
      await tx.wait();
      showMessage(`Successfully withdrew ${withdrawAmount} BLUE`, 'success');
      setWithdrawAmount('');
      dice.fetchStats();
    } catch (err) {
      showMessage(err.reason || err.message || 'Failed to withdraw', 'error');
    }
  };

  const handleUpdateLimits = async (e) => {
    e.preventDefault();
    if (!dice.contract) return;

    try {
      const min = newMinBet || dice.limits?.minBet || '5';
      const max = newMaxBet || dice.limits?.maxBet || '500';
      const maxPay = newMaxPayout || dice.limits?.maxPayout || '5000';

      const tx = await dice.contract.setLimits(
        ethers.parseEther(min),
        ethers.parseEther(max),
        ethers.parseEther(maxPay)
      );
      await tx.wait();
      showMessage('Limits updated successfully', 'success');
      setNewMinBet('');
      setNewMaxBet('');
      setNewMaxPayout('');
      dice.fetchStats();
    } catch (err) {
      showMessage(err.reason || err.message || 'Failed to update limits', 'error');
    }
  };

  const handlePause = async () => {
    if (!dice.contract) return;
    try {
      const tx = await dice.contract.pause();
      await tx.wait();
      showMessage('Contract paused', 'success');
      dice.fetchStats();
    } catch (err) {
      showMessage(err.reason || err.message || 'Failed to pause', 'error');
    }
  };

  const handleUnpause = async () => {
    if (!dice.contract) return;
    try {
      const tx = await dice.contract.unpause();
      await tx.wait();
      showMessage('Contract unpaused', 'success');
      dice.fetchStats();
    } catch (err) {
      showMessage(err.reason || err.message || 'Failed to unpause', 'error');
    }
  };

  // Calculate profit/loss metrics
  const calculateProfitLoss = () => {
    const diceStats = dice?.stats || {};
    const progStats = progressive?.stats || {};
    const raffleInfo = raffle?.roundInfo || {};

    // Classic Dice P/L
    const diceWagered = parseFloat(diceStats.totalWagered) || 0;
    const dicePaidOut = parseFloat(diceStats.totalPaidOut) || 0;
    const diceProfit = parseFloat(diceStats.houseProfit) || 0;
    const diceBankroll = parseFloat(diceStats.houseBankroll) || 0;

    // Progressive P/L (revenue = ticket sales, costs = payouts)
    const progRolls = progStats.totalRolls || 0;
    const progTicketPrice = parseFloat(progStats.ticketPrice) || 1;
    const progRevenue = progRolls * progTicketPrice;
    const progPaidOut = parseFloat(progStats.totalPaidOut) || 0;
    const progJackpot = parseFloat(progStats.jackpotPool) || 0;
    // Profit = revenue - payouts (jackpot pool is held for future payouts)
    const progProfit = progRevenue - progPaidOut - progJackpot;

    // Raffle P/L (6% house take on prize pool)
    const rafflePrizePool = parseFloat(raffleInfo.prizePool) || 0;
    const raffleTotalTickets = parseFloat(raffleInfo.totalTickets) || 0;
    // Estimate: prize pool is 94% of entries, so total entries = prizePool / 0.94
    const raffleEstimatedRevenue = rafflePrizePool > 0 ? rafflePrizePool / 0.94 : 0;
    const raffleHouseTake = raffleEstimatedRevenue * 0.06;

    // Combined metrics
    const totalRevenue = diceWagered + progRevenue + raffleEstimatedRevenue;
    const totalPaidOut = dicePaidOut + progPaidOut;
    const totalProfit = diceProfit + progProfit + raffleHouseTake;
    const totalLiquidity = diceBankroll + progJackpot + rafflePrizePool;

    // Estimated burns and treasury (from house edge)
    const diceBurned = diceWagered * 0.01; // 1% burn
    const diceTreasury = diceWagered * 0.02; // 2% treasury

    return {
      dice: { wagered: diceWagered, paidOut: dicePaidOut, profit: diceProfit, bankroll: diceBankroll },
      progressive: { revenue: progRevenue, paidOut: progPaidOut, profit: progProfit, jackpot: progJackpot },
      raffle: { revenue: raffleEstimatedRevenue, prizePool: rafflePrizePool, houseTake: raffleHouseTake },
      totals: { revenue: totalRevenue, paidOut: totalPaidOut, profit: totalProfit, liquidity: totalLiquidity },
      ecosystem: { burned: diceBurned, treasury: diceTreasury }
    };
  };

  const pnl = calculateProfitLoss();

  if (!account) {
    return (
      <div className="admin-panel">
        <h2>Admin Panel</h2>
        <p className="warning">Connect wallet to access admin functions</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Profit/Loss Analysis Dashboard */}
      <section className="admin-section pnl-dashboard">
        <h3>Profit/Loss Analysis</h3>

        {/* Summary Cards */}
        <div className="pnl-summary-grid">
          <div className="pnl-card total-revenue">
            <span className="pnl-label">Total Volume</span>
            <span className="pnl-value">{pnl.totals.revenue.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
          </div>
          <div className="pnl-card total-payout">
            <span className="pnl-label">Total Paid Out</span>
            <span className="pnl-value">{pnl.totals.paidOut.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
          </div>
          <div className={`pnl-card total-profit ${pnl.totals.profit >= 0 ? 'positive' : 'negative'}`}>
            <span className="pnl-label">Net House Profit</span>
            <span className="pnl-value">{pnl.totals.profit >= 0 ? '+' : ''}{pnl.totals.profit.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
          </div>
          <div className="pnl-card total-liquidity">
            <span className="pnl-label">Total Liquidity</span>
            <span className="pnl-value">{pnl.totals.liquidity.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
          </div>
        </div>

        {/* Game Breakdown */}
        <div className="pnl-breakdown">
          <h4>Breakdown by Game</h4>
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Volume/Revenue</th>
                <th>Paid Out</th>
                <th>Profit/Loss</th>
                <th>Held Funds</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="game-badge dice">🎲 Classic Dice</span></td>
                <td>{pnl.dice.wagered.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td>{pnl.dice.paidOut.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td className={pnl.dice.profit >= 0 ? 'profit' : 'loss'}>
                  {pnl.dice.profit >= 0 ? '+' : ''}{pnl.dice.profit.toLocaleString(undefined, {maximumFractionDigits: 2})}
                </td>
                <td>{pnl.dice.bankroll.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><span className="game-badge progressive">🎰 Progressive</span></td>
                <td>{pnl.progressive.revenue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td>{pnl.progressive.paidOut.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td className={pnl.progressive.profit >= 0 ? 'profit' : 'loss'}>
                  {pnl.progressive.profit >= 0 ? '+' : ''}{pnl.progressive.profit.toLocaleString(undefined, {maximumFractionDigits: 2})}
                </td>
                <td>{pnl.progressive.jackpot.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td><span className="game-badge raffle">🎟️ Raffle</span></td>
                <td>{pnl.raffle.revenue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td>-</td>
                <td className="profit">+{pnl.raffle.houseTake.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td>{pnl.raffle.prizePool.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ecosystem Impact */}
        <div className="pnl-ecosystem">
          <h4>Ecosystem Impact (Estimated)</h4>
          <div className="ecosystem-stats">
            <div className="eco-stat">
              <span className="eco-icon">🔥</span>
              <span className="eco-value">{pnl.ecosystem.burned.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
              <span className="eco-label">Burned</span>
            </div>
            <div className="eco-stat">
              <span className="eco-icon">🏛️</span>
              <span className="eco-value">{pnl.ecosystem.treasury.toLocaleString(undefined, {maximumFractionDigits: 2})} BLUE</span>
              <span className="eco-label">To Treasury</span>
            </div>
          </div>
        </div>
      </section>

      {!isOwner && (
        <div className="owner-only-notice">
          <p>Admin controls are owner-only.</p>
          <p>Connected as: {account}</p>
        </div>
      )}

      {/* Classic Dice Section */}
      <div className="admin-game-group">
        <div className="admin-game-header dice">
          <span className="game-icon">🎲</span>
          <h3>Classic Dice</h3>
          <span className={`status-badge ${dice.limits?.paused ? 'paused' : 'active'}`}>
            {dice.limits?.paused ? 'PAUSED' : 'ACTIVE'}
          </span>
        </div>

        <div className="admin-game-content">
          {/* Stats */}
          {dice.stats && (
            <div className="admin-stats-row">
              <div className="admin-stat">
                <span className="stat-value">{parseFloat(dice.stats.houseBankroll).toLocaleString()}</span>
                <span className="stat-label">Bankroll (BLUE)</span>
              </div>
              <div className="admin-stat">
                <span className="stat-value">{dice.stats.totalBets.toLocaleString()}</span>
                <span className="stat-label">Total Bets</span>
              </div>
              <div className="admin-stat">
                <span className="stat-value">{parseFloat(dice.stats.totalWagered).toLocaleString()}</span>
                <span className="stat-label">Wagered (BLUE)</span>
              </div>
              <div className="admin-stat">
                <span className={`stat-value ${parseFloat(dice.stats.houseProfit) >= 0 ? 'profit' : 'loss'}`}>
                  {parseFloat(dice.stats.houseProfit) >= 0 ? '+' : ''}{parseFloat(dice.stats.houseProfit).toLocaleString()}
                </span>
                <span className="stat-label">House Profit</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="admin-actions-grid">
            <div className="admin-action-box">
              <h4>Fund Bankroll</h4>
              <form onSubmit={handleFundHouse}>
                <div className="form-row">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount (BLUE)"
                    min="1"
                    step="1"
                  />
                  <button type="submit" className="btn btn-primary" disabled={dice.loading}>
                    Fund
                  </button>
                </div>
              </form>
            </div>

            {isOwner && (
              <>
                <div className="admin-action-box">
                  <h4>Withdraw</h4>
                  <form onSubmit={handleWithdraw}>
                    <div className="form-row">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Amount (BLUE)"
                        min="1"
                        step="1"
                      />
                      <button type="submit" className="btn btn-warning" disabled={dice.loading}>
                        Withdraw
                      </button>
                    </div>
                  </form>
                </div>

                <div className="admin-action-box">
                  <h4>Contract</h4>
                  <div className="button-group">
                    {dice.limits?.paused ? (
                      <button className="btn btn-success" onClick={handleUnpause}>
                        Unpause
                      </button>
                    ) : (
                      <button className="btn btn-warning" onClick={handlePause}>
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Limits (Owner Only) */}
          {isOwner && (
            <div className="admin-limits-section">
              <h4>Betting Limits</h4>
              <form onSubmit={handleUpdateLimits} className="limits-form">
                <div className="limits-grid">
                  <div className="form-group">
                    <label>Min Bet</label>
                    <input
                      type="number"
                      value={newMinBet}
                      onChange={(e) => setNewMinBet(e.target.value)}
                      placeholder={dice.limits?.minBet || '5'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Bet</label>
                    <input
                      type="number"
                      value={newMaxBet}
                      onChange={(e) => setNewMaxBet(e.target.value)}
                      placeholder={dice.limits?.maxBet || '500'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Payout</label>
                    <input
                      type="number"
                      value={newMaxPayout}
                      onChange={(e) => setNewMaxPayout(e.target.value)}
                      placeholder={dice.limits?.maxPayout || '5000'}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={dice.loading}>
                    Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Progressive Jackpot Section */}
      {progressive && progressive.contract && (
        <div className="admin-game-group">
          <div className="admin-game-header progressive">
            <span className="game-icon">🎰</span>
            <h3>Progressive Jackpot</h3>
            <span className="status-badge active">ACTIVE</span>
          </div>

          <div className="admin-game-content">
            {/* Stats */}
            {progressive.stats && (
              <div className="admin-stats-row">
                <div className="admin-stat highlight">
                  <span className="stat-value gold">{parseFloat(progressive.stats.jackpotPool).toLocaleString()}</span>
                  <span className="stat-label">Jackpot Pool (BLUE)</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">#{progressive.stats.currentRoundId}</span>
                  <span className="stat-label">Current Round</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">{progressive.stats.totalRolls.toLocaleString()}</span>
                  <span className="stat-label">Total Rolls</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">{progressive.stats.totalJackpotsWon}</span>
                  <span className="stat-label">Jackpots Won</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">{parseFloat(progressive.stats.totalPaidOut).toLocaleString()}</span>
                  <span className="stat-label">Paid Out (BLUE)</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="admin-actions-grid">
              <div className="admin-action-box">
                <h4>Fund Jackpot</h4>
                <form onSubmit={handleFundJackpot}>
                  <div className="form-row">
                    <input
                      type="number"
                      value={jackpotFundAmount}
                      onChange={(e) => setJackpotFundAmount(e.target.value)}
                      placeholder="Amount (BLUE)"
                      min="1"
                      step="1"
                    />
                    <button type="submit" className="btn btn-primary" disabled={progressive.loading}>
                      Fund
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raffle Section */}
      {raffle && raffle.contract && (
        <div className="admin-game-group">
          <div className="admin-game-header raffle">
            <span className="game-icon">🎟️</span>
            <h3>Blue Raffle</h3>
            <span className={`status-badge ${raffle.roundInfo?.status === 'Active' ? 'active' : 'pending'}`}>
              {raffle.roundInfo?.status || 'LOADING'}
            </span>
          </div>

          <div className="admin-game-content">
            {/* Stats */}
            {raffle.roundInfo && (
              <div className="admin-stats-row">
                <div className="admin-stat highlight">
                  <span className="stat-value purple">{parseFloat(raffle.roundInfo.prizePool).toLocaleString()}</span>
                  <span className="stat-label">Prize Pool (BLUE)</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">#{raffle.roundInfo.roundId}</span>
                  <span className="stat-label">Round</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">{raffle.roundInfo.uniqueWallets}</span>
                  <span className="stat-label">Participants</span>
                </div>
                <div className="admin-stat">
                  <span className="stat-value">{parseFloat(raffle.roundInfo.totalTickets).toLocaleString()}</span>
                  <span className="stat-label">Total Tickets</span>
                </div>
              </div>
            )}

            {/* Actions (Owner Only) */}
            {isOwner && (
              <div className="admin-actions-grid">
                <div className="admin-action-box">
                  <h4>Bonus Multiplier</h4>
                  <div className="form-row">
                    <select
                      value={bonusMultiplier}
                      onChange={(e) => setBonusMultiplier(e.target.value)}
                    >
                      <option value="1">1x (Normal)</option>
                      <option value="2">2x (Double)</option>
                      <option value="3">3x (Triple)</option>
                      <option value="5">5x</option>
                      <option value="10">10x</option>
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        const success = await raffle.setBonusMultiplier(parseInt(bonusMultiplier));
                        if (success) {
                          showMessage(`Bonus multiplier set to ${bonusMultiplier}x`, 'success');
                        } else {
                          showMessage(raffle.error || 'Failed to set multiplier', 'error');
                        }
                      }}
                      disabled={raffle.loading}
                    >
                      Set
                    </button>
                  </div>
                </div>

                <div className="admin-action-box">
                  <h4>Emergency</h4>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel the current round? All participants will be refunded.')) {
                        const success = await raffle.cancelRound();
                        if (success) {
                          showMessage('Round cancelled and refunds processed', 'success');
                        } else {
                          showMessage(raffle.error || 'Failed to cancel round', 'error');
                        }
                      }
                    }}
                    disabled={raffle.loading}
                  >
                    Cancel & Refund
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raffle Not Deployed Notice */}
      {raffle && !raffle.contract && (
        <div className="admin-game-group">
          <div className="admin-game-header raffle">
            <span className="game-icon">🎟️</span>
            <h3>Blue Raffle</h3>
            <span className="status-badge pending">NOT DEPLOYED</span>
          </div>
          <div className="admin-game-content">
            <p className="warning">Raffle contract not deployed. Run the deploy script to deploy.</p>
          </div>
        </div>
      )}

      {/* Tools Section */}
      {isOwner && (
        <div className="admin-game-group">
          <div className="admin-game-header tools">
            <span className="game-icon">🛠️</span>
            <h3>Tools</h3>
          </div>

          <div className="admin-game-content">
            <div className="admin-actions-grid">
              <div className="admin-action-box">
                <h4>Test Token Faucet</h4>
                <p className="action-desc">Share with testers to help them get started</p>
                <div className="button-group">
                  <Link to="/faucet" className="btn btn-primary">
                    Open Faucet
                  </Link>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const faucetUrl = `${window.location.origin}/faucet`;
                      navigator.clipboard.writeText(faucetUrl);
                      showMessage('Faucet link copied to clipboard!', 'success');
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Manager Section */}
      <GameManagerSection showMessage={showMessage} />
    </div>
  );
}

// Game Manager Admin Section Component
function GameManagerSection({ showMessage }) {
  // Get game context with fallback
  let gameContext = null;
  try {
    gameContext = useGameContext();
  } catch (e) {
    return null; // Don't render if context not available
  }

  const {
    games,
    isOwner: isGameManagerOwner,
    useContractData,
    setGameEnabled,
    setGameVisible,
    setGameFeatured,
    refreshGames,
    loading
  } = gameContext;

  const [updating, setUpdating] = useState({});

  const handleToggle = async (gameId, field, currentValue) => {
    const key = `${gameId}-${field}`;
    setUpdating(prev => ({ ...prev, [key]: true }));

    try {
      if (field === 'enabled') {
        await setGameEnabled(gameId, !currentValue);
      } else if (field === 'visible') {
        await setGameVisible(gameId, !currentValue);
      } else if (field === 'featured') {
        await setGameFeatured(gameId, !currentValue);
      }
      showMessage(`Updated ${gameId} ${field} to ${!currentValue}`, 'success');
    } catch (err) {
      showMessage(err.message || `Failed to update ${field}`, 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!useContractData) {
    return (
      <div className="admin-game-group">
        <div className="admin-game-header gamemanager">
          <span className="game-icon">🎮</span>
          <h3>Game Manager</h3>
          <span className="status-badge pending">FALLBACK MODE</span>
        </div>
        <div className="admin-game-content">
          <p className="warning">
            GameManager contract not connected. Connect wallet to BSC Testnet to manage games.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Contract: 0x0b034C11B659b357Ba820Cf2fED3A9CBcA1c223B
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-game-group">
      <div className="admin-game-header gamemanager">
        <span className="game-icon">🎮</span>
        <h3>Game Manager</h3>
        <span className="status-badge active">CONNECTED</span>
      </div>

      <div className="admin-game-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Control which games are visible and playable
          </p>
          <button
            className="btn btn-secondary"
            onClick={refreshGames}
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            Refresh
          </button>
        </div>

        <div className="game-manager-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Game</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>Visible</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>Enabled</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>Featured</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>Order</th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => (
                <tr key={game.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {game.id === 'dice' ? '🎲' :
                         game.id === 'progressive' ? '💎' :
                         game.id === 'raffle' ? '🎟️' :
                         game.id === 'slots' ? '🎰' : '🎮'}
                      </span>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: '500' }}>{game.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{game.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button
                      className={`toggle-btn ${game.visible ? 'on' : 'off'}`}
                      onClick={() => handleToggle(game.id, 'visible', game.visible)}
                      disabled={!isGameManagerOwner || updating[`${game.id}-visible`]}
                      title={isGameManagerOwner ? 'Toggle visibility' : 'Owner only'}
                    >
                      {game.visible ? '✓' : '✗'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button
                      className={`toggle-btn ${game.enabled ? 'on' : 'off'}`}
                      onClick={() => handleToggle(game.id, 'enabled', game.enabled)}
                      disabled={!isGameManagerOwner || updating[`${game.id}-enabled`]}
                      title={isGameManagerOwner ? 'Toggle enabled' : 'Owner only'}
                    >
                      {game.enabled ? '✓' : '✗'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button
                      className={`toggle-btn ${game.featured ? 'on' : 'off'}`}
                      onClick={() => handleToggle(game.id, 'featured', game.featured)}
                      disabled={!isGameManagerOwner || updating[`${game.id}-featured`]}
                      title={isGameManagerOwner ? 'Toggle featured' : 'Owner only'}
                    >
                      {game.featured ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b' }}>
                    {game.sortOrder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isGameManagerOwner && (
          <p style={{ marginTop: '15px', color: '#f59e0b', fontSize: '0.85rem' }}>
            Connect as contract owner to modify game settings
          </p>
        )}

        <style>{`
          .toggle-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: 2px solid;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .toggle-btn.on {
            background: rgba(34, 197, 94, 0.2);
            border-color: #22c55e;
            color: #22c55e;
          }
          .toggle-btn.off {
            background: rgba(239, 68, 68, 0.1);
            border-color: #475569;
            color: #64748b;
          }
          .toggle-btn:hover:not(:disabled) {
            transform: scale(1.1);
          }
          .toggle-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .admin-game-header.gamemanager {
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          }
        `}</style>
      </div>
    </div>
  );
}

export default AdminPanel;
