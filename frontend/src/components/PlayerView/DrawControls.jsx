import React, { useState, useEffect } from 'react';

export function DrawControls({ roundInfo, requestDraw, executeDraw, canRequestDraw, canExecuteDraw, loading }) {
  const [drawStatus, setDrawStatus] = useState({ canRequest: false, canExecute: false, reason: '' });

  useEffect(() => {
    const checkDrawStatus = async () => {
      if (roundInfo?.statusCode === 1) {
        const requestStatus = await canRequestDraw();
        setDrawStatus({ ...requestStatus, canExecute: false });
      } else if (roundInfo?.statusCode === 2) {
        const executeStatus = await canExecuteDraw();
        setDrawStatus({ canRequest: false, ...executeStatus });
      } else {
        setDrawStatus({ canRequest: false, canExecute: false, reason: 'Round not ready' });
      }
    };

    checkDrawStatus();
    const interval = setInterval(checkDrawStatus, 3000);
    return () => clearInterval(interval);
  }, [roundInfo, canRequestDraw, canExecuteDraw]);

  const handleRequestDraw = async () => {
    const success = await requestDraw();
    if (success) {
      console.log('Draw requested successfully!');
    }
  };

  const handleExecuteDraw = async () => {
    const success = await executeDraw();
    if (success) {
      console.log('Draw executed successfully!');
    }
  };

  // Only show if round is Active or Drawing
  if (!roundInfo || (roundInfo.statusCode !== 1 && roundInfo.statusCode !== 2)) {
    return null;
  }

  return (
    <div className="raffle-card" style={{ marginTop: '20px' }}>
      <h3>Draw Controls</h3>

      {roundInfo.statusCode === 1 && (
        <div>
          <p style={{ marginBottom: '15px', color: '#94a3b8' }}>
            {drawStatus.canRequest ? '✅ Ready to request draw!' : `⏳ ${drawStatus.reason}`}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleRequestDraw}
            disabled={!drawStatus.canRequest || loading}
            style={{ width: '100%', padding: '15px' }}
          >
            {loading ? 'Processing...' : 'Request Draw (Step 1)'}
          </button>
        </div>
      )}

      {roundInfo.statusCode === 2 && (
        <div>
          <p style={{ marginBottom: '15px', color: '#94a3b8' }}>
            {drawStatus.canExecute ? '✅ Ready to execute draw!' : `⏳ ${drawStatus.reason}`}
          </p>
          <button
            className="btn btn-success"
            onClick={handleExecuteDraw}
            disabled={!drawStatus.canExecute || loading}
            style={{ width: '100%', padding: '15px' }}
          >
            {loading ? 'Processing...' : 'Execute Draw (Step 2)'}
          </button>
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#f59e0b' }}>
            ⚠️ Must wait 2 blocks after requesting draw
          </p>
        </div>
      )}
    </div>
  );
}
