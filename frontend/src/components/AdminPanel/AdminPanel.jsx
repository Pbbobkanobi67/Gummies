import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function AdminPanel({ contract, account, signer }) {
  const [isOwner, setIsOwner] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [bonusMultiplier, setBonusMultiplier] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkOwner();
    checkPausedStatus();
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

  const checkPausedStatus = async () => {
    if (!contract) return;

    try {
      const paused = await contract.paused();
      setIsPaused(paused);
    } catch (err) {
      console.error('Error checking paused status:', err);
    }
  };

  const handlePause = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setMessage(null);

      const tx = await contract.pause();
      await tx.wait();

      setIsPaused(true);
      setMessage({ type: 'success', text: 'Contract paused successfully' });
    } catch (err) {
      console.error('Error pausing:', err);
      setMessage({ type: 'error', text: err.message });
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
      setMessage({ type: 'success', text: 'Contract unpaused successfully' });
    } catch (err) {
      console.error('Error unpausing:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

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

      setMessage({ type: 'success', text: `Bonus multiplier set to ${multiplier}x` });
    } catch (err) {
      console.error('Error setting multiplier:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

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

      setMessage({ type: 'success', text: 'Round cancelled and participants refunded' });
    } catch (err) {
      console.error('Error cancelling round:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null; // Don't show admin panel if not owner
  }

  return (
    <div className="admin-panel">
      <h2>⚙️ Admin Panel</h2>

      {message && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <div className="control-group">
          <h3>Contract Status</h3>
          <p>Status: <strong>{isPaused ? '🔴 Paused' : '🟢 Active'}</strong></p>
          <button
            className={`btn ${isPaused ? 'btn-success' : 'btn-danger'}`}
            onClick={isPaused ? handleUnpause : handlePause}
            disabled={loading}
          >
            {isPaused ? 'Unpause Contract' : 'Pause Contract'}
          </button>
        </div>

        <div className="control-group">
          <h3>Bonus Round</h3>
          <label>Ticket Multiplier (1-10)</label>
          <input
            type="number"
            value={bonusMultiplier}
            onChange={(e) => setBonusMultiplier(e.target.value)}
            min="1"
            max="10"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '10px',
              background: 'var(--bg-dark)',
              color: 'var(--text-light)',
              border: '2px solid var(--warning)',
              borderRadius: '8px',
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSetBonusMultiplier}
            disabled={loading}
          >
            Set Multiplier
          </button>
        </div>

        <div className="control-group">
          <h3>Emergency Controls</h3>
          <button
            className="btn btn-danger"
            onClick={handleCancelRound}
            disabled={loading}
          >
            Cancel Current Round
          </button>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px' }}>
            ⚠️ Refunds all participants
          </p>
        </div>
      </div>
    </div>
  );
}
