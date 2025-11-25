import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function AdminPanel({ dice, account }) {
  const [isOwner, setIsOwner] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newMinBet, setNewMinBet] = useState('');
  const [newMaxBet, setNewMaxBet] = useState('');
  const [newMaxPayout, setNewMaxPayout] = useState('');
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

      {/* Fund House - Available to everyone */}
      <section className="admin-section">
        <h3>Fund House Bankroll</h3>
        <p className="section-desc">Anyone can add BLUE tokens to the house bankroll</p>
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
              {dice.loading ? 'Processing...' : 'Fund House'}
            </button>
          </div>
        </form>
        {dice.stats && (
          <p className="current-value">
            Current Bankroll: {parseFloat(dice.stats.houseBankroll).toLocaleString()} BLUE
          </p>
        )}
      </section>

      {!isOwner && (
        <div className="owner-only-notice">
          <p>The following functions are owner-only.</p>
          <p>Connected as: {account}</p>
        </div>
      )}

      {/* Owner-only functions */}
      {isOwner && (
        <>
          {/* Withdraw */}
          <section className="admin-section">
            <h3>Withdraw from Bankroll</h3>
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
          </section>

          {/* Update Limits */}
          <section className="admin-section">
            <h3>Betting Limits</h3>
            <form onSubmit={handleUpdateLimits}>
              <div className="form-group">
                <label>Min Bet (BLUE)</label>
                <input
                  type="number"
                  value={newMinBet}
                  onChange={(e) => setNewMinBet(e.target.value)}
                  placeholder={dice.limits?.minBet || '5'}
                />
              </div>
              <div className="form-group">
                <label>Max Bet (BLUE)</label>
                <input
                  type="number"
                  value={newMaxBet}
                  onChange={(e) => setNewMaxBet(e.target.value)}
                  placeholder={dice.limits?.maxBet || '500'}
                />
              </div>
              <div className="form-group">
                <label>Max Payout (BLUE)</label>
                <input
                  type="number"
                  value={newMaxPayout}
                  onChange={(e) => setNewMaxPayout(e.target.value)}
                  placeholder={dice.limits?.maxPayout || '5000'}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={dice.loading}>
                Update Limits
              </button>
            </form>
          </section>

          {/* Pause/Unpause */}
          <section className="admin-section">
            <h3>Contract Controls</h3>
            <div className="button-group">
              {dice.limits?.paused ? (
                <button className="btn btn-success" onClick={handleUnpause}>
                  Unpause Contract
                </button>
              ) : (
                <button className="btn btn-warning" onClick={handlePause}>
                  Pause Contract
                </button>
              )}
            </div>
            <p className="current-value">
              Status: {dice.limits?.paused ? 'PAUSED' : 'ACTIVE'}
            </p>
          </section>

          {/* Statistics */}
          <section className="admin-section">
            <h3>House Statistics</h3>
            {dice.stats && (
              <div className="stats-list">
                <div className="stat-row">
                  <span>Total Bets:</span>
                  <span>{dice.stats.totalBets.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span>Total Wagered:</span>
                  <span>{parseFloat(dice.stats.totalWagered).toLocaleString()} BLUE</span>
                </div>
                <div className="stat-row">
                  <span>Total Paid Out:</span>
                  <span>{parseFloat(dice.stats.totalPaidOut).toLocaleString()} BLUE</span>
                </div>
                <div className="stat-row highlight">
                  <span>House Profit:</span>
                  <span>{parseFloat(dice.stats.houseProfit).toLocaleString()} BLUE</span>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminPanel;
