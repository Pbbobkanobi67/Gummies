import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function AdminPanel({ contract, account, signer }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Contract state
  const [isPaused, setIsPaused] = useState(false);
  const [analytics, setAnalytics] = useState({
    currentRound: 0,
    contractBalance: '0',
    minTickets: '0',
    maxTickets: '0',
    roundDuration: 0,
    ticketMultiplier: 1,
  });

  // Form inputs
  const [bonusMultiplier, setBonusMultiplier] = useState('1');
  const [minTickets, setMinTickets] = useState('5');
  const [maxTickets, setMaxTickets] = useState('150');
  const [minParticipants, setMinParticipants] = useState('2');
  const [roundDuration, setRoundDuration] = useState('300');
  const [treasuryWallet, setTreasuryWallet] = useState('');
  const [developerWallet, setDeveloperWallet] = useState('');

  useEffect(() => {
    checkOwner();
    loadAnalytics();
  }, [contract, account]);

  const checkOwner = async () => {
    if (!contract || !account) return;

    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error('Error checking owner:', err);
      setIsOwner(false);
    }
  };

  const loadAnalytics = async () => {
    if (!contract) return;

    try {
      const [
        paused,
        currentRoundId,
        minTix,
        maxTix,
        duration,
        multiplier,
        treasury,
        developer,
      ] = await Promise.all([
        contract.paused(),
        contract.currentRoundId(),
        contract.minTickets(),
        contract.maxTickets(),
        contract.roundDuration(),
        contract.ticketMultiplier(),
        contract.treasuryWallet(),
        contract.developerWallet(),
      ]);

      // Get contract balance
      const balance = await contract.blueToken().then(async (tokenAddr) => {
        const token = new ethers.Contract(
          tokenAddr,
          ['function balanceOf(address) view returns (uint256)'],
          contract.runner
        );
        return await token.balanceOf(await contract.getAddress());
      });

      setIsPaused(paused);
      setAnalytics({
        currentRound: currentRoundId.toString(),
        contractBalance: ethers.formatEther(balance),
        minTickets: ethers.formatEther(minTix),
        maxTickets: ethers.formatEther(maxTix),
        roundDuration: Number(duration),
        ticketMultiplier: Number(multiplier),
      });

      // Set form defaults
      setMinTickets(ethers.formatEther(minTix));
      setMaxTickets(ethers.formatEther(maxTix));
      setRoundDuration(duration.toString());
      setBonusMultiplier(multiplier.toString());
      setTreasuryWallet(treasury);
      setDeveloperWallet(developer);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Contract Status Controls
  const handlePause = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const tx = await contract.pause();
      await tx.wait();
      setIsPaused(true);
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Contract paused successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpause = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const tx = await contract.unpause();
      await tx.wait();
      setIsPaused(false);
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Contract unpaused successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Bonus Multiplier
  const handleSetBonusMultiplier = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const multiplier = parseInt(bonusMultiplier);
      if (multiplier < 1 || multiplier > 10) {
        setMessage({ type: 'error', text: 'Multiplier must be between 1 and 10' });
        return;
      }
      const tx = await contract.setBonusMultiplier(multiplier);
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: `Bonus multiplier set to ${multiplier}x` });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Entry Limits
  const handleSetEntryLimits = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const min = ethers.parseEther(minTickets);
      const max = ethers.parseEther(maxTickets);
      const minPart = parseInt(minParticipants);
      const tx = await contract.setEntryLimits(min, max, minPart);
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Entry limits updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Round Duration
  const handleSetRoundDuration = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const duration = parseInt(roundDuration);
      const tx = await contract.setRoundDuration(duration);
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: `Round duration set to ${duration} seconds` });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Update Wallets
  const handleSetTreasuryWallet = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const tx = await contract.setTreasuryWallet(treasuryWallet);
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Treasury wallet updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDeveloperWallet = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      setMessage(null);
      const tx = await contract.setDeveloperWallet(developerWallet);
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Developer wallet updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Cancel Round
  const handleCancelRound = async () => {
    if (!contract) return;
    const confirmed = window.confirm(
      'Are you sure you want to cancel the current round? All participants will be refunded.'
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      setMessage(null);
      const tx = await contract.cancelRound();
      await tx.wait();
      await loadAnalytics();
      setMessage({ type: 'success', text: 'Round cancelled and participants refunded' });
    } catch (err) {
      setMessage({ type: 'error', text: err.shortMessage || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="admin-panel">
      <h2>⚙️ Admin Control Panel</h2>

      {message && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {/* Analytics Section */}
      <div className="admin-section">
        <h3>📊 Analytics</h3>
        <div className="admin-controls">
          <div className="control-group">
            <h4>Contract Stats</h4>
            <p>Current Round: <strong>#{analytics.currentRound}</strong></p>
            <p>Contract Balance: <strong>{parseFloat(analytics.contractBalance).toFixed(2)} BLUE</strong></p>
            <p>Status: <strong>{isPaused ? '🔴 Paused' : '🟢 Active'}</strong></p>
          </div>

          <div className="control-group">
            <h4>Current Settings</h4>
            <p>Min Tickets: <strong>{analytics.minTickets} BLUE</strong></p>
            <p>Max Tickets: <strong>{analytics.maxTickets} BLUE</strong></p>
            <p>Round Duration: <strong>{analytics.roundDuration}s ({Math.floor(analytics.roundDuration / 60)}m)</strong></p>
            <p>Ticket Multiplier: <strong>{analytics.ticketMultiplier}x</strong></p>
          </div>

          <div className="control-group">
            <h4>Wallets</h4>
            <p style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
              Treasury: <strong>{treasuryWallet.slice(0, 10)}...{treasuryWallet.slice(-8)}</strong>
            </p>
            <p style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
              Developer: <strong>{developerWallet.slice(0, 10)}...{developerWallet.slice(-8)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Contract Controls */}
      <div className="admin-section">
        <h3>🎛️ Contract Controls</h3>
        <div className="admin-controls">
          <div className="control-group">
            <h4>Contract Status</h4>
            <button
              className={`btn ${isPaused ? 'btn-success' : 'btn-danger'}`}
              onClick={isPaused ? handleUnpause : handlePause}
              disabled={loading}
            >
              {isPaused ? 'Unpause Contract' : 'Pause Contract'}
            </button>
          </div>

          <div className="control-group">
            <h4>Bonus Round Multiplier</h4>
            <input
              type="number"
              value={bonusMultiplier}
              onChange={(e) => setBonusMultiplier(e.target.value)}
              min="1"
              max="10"
              className="admin-input"
            />
            <button className="btn btn-primary" onClick={handleSetBonusMultiplier} disabled={loading}>
              Set {bonusMultiplier}x Multiplier
            </button>
          </div>

          <div className="control-group">
            <h4>Emergency</h4>
            <button className="btn btn-danger" onClick={handleCancelRound} disabled={loading}>
              Cancel Round & Refund
            </button>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px' }}>
              ⚠️ Refunds all participants
            </p>
          </div>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="admin-section">
        <h3>⚙️ Parameter Controls</h3>
        <div className="admin-controls">
          <div className="control-group">
            <h4>Entry Limits</h4>
            <label>Min Tickets (BLUE)</label>
            <input
              type="number"
              value={minTickets}
              onChange={(e) => setMinTickets(e.target.value)}
              className="admin-input"
            />
            <label>Max Tickets (BLUE)</label>
            <input
              type="number"
              value={maxTickets}
              onChange={(e) => setMaxTickets(e.target.value)}
              className="admin-input"
            />
            <label>Min Participants</label>
            <input
              type="number"
              value={minParticipants}
              onChange={(e) => setMinParticipants(e.target.value)}
              className="admin-input"
            />
            <button className="btn btn-primary" onClick={handleSetEntryLimits} disabled={loading}>
              Update Entry Limits
            </button>
          </div>

          <div className="control-group">
            <h4>Round Duration</h4>
            <label>Duration (seconds)</label>
            <input
              type="number"
              value={roundDuration}
              onChange={(e) => setRoundDuration(e.target.value)}
              className="admin-input"
            />
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {Math.floor(parseInt(roundDuration || 0) / 60)} minutes
            </p>
            <button className="btn btn-primary" onClick={handleSetRoundDuration} disabled={loading}>
              Update Duration
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Management */}
      <div className="admin-section">
        <h3>💼 Wallet Management</h3>
        <div className="admin-controls">
          <div className="control-group">
            <h4>Treasury Wallet</h4>
            <input
              type="text"
              value={treasuryWallet}
              onChange={(e) => setTreasuryWallet(e.target.value)}
              placeholder="0x..."
              className="admin-input"
            />
            <button className="btn btn-primary" onClick={handleSetTreasuryWallet} disabled={loading}>
              Update Treasury
            </button>
          </div>

          <div className="control-group">
            <h4>Developer Wallet</h4>
            <input
              type="text"
              value={developerWallet}
              onChange={(e) => setDeveloperWallet(e.target.value)}
              placeholder="0x..."
              className="admin-input"
            />
            <button className="btn btn-primary" onClick={handleSetDeveloperWallet} disabled={loading}>
              Update Developer
            </button>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="btn btn-secondary" onClick={loadAnalytics} disabled={loading}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
