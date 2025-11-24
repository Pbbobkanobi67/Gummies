import React, { useState, useEffect } from 'react';

export function ActionBanner({
  roundInfo,
  canRequestDraw,
  canExecuteDraw,
  requestDraw,
  executeDraw,
  loading
}) {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [drawState, setDrawState] = useState({ canRequest: false, canExecute: false });

  useEffect(() => {
    const checkState = async () => {
      // Only show banner when round is Active (time up) or Drawing
      if (!roundInfo || (roundInfo.statusCode !== 1 && roundInfo.statusCode !== 2)) {
        setShowBanner(false);
        return;
      }

      // Check if we can request or execute draw
      const requestStatus = await canRequestDraw();
      const executeStatus = await canExecuteDraw();

      // Check if draw has expired
      const isExpired = (requestStatus.reason &&
        (requestStatus.reason.toLowerCase().includes('expired') ||
         requestStatus.reason.toLowerCase().includes('expire'))) ||
        (executeStatus.reason &&
        (executeStatus.reason.toLowerCase().includes('expired') ||
         executeStatus.reason.toLowerCase().includes('expire')));

      // Hide banner if draw is expired - let the DrawControls component handle it
      if (isExpired) {
        setShowBanner(false);
        return;
      }

      setDrawState({
        canRequest: requestStatus.canRequest,
        canExecute: executeStatus.canExecute
      });

      // Show banner if either action is available
      if (requestStatus.canRequest || executeStatus.canExecute) {
        setShowBanner(true);

        if (roundInfo.statusCode === 1 && requestStatus.canRequest) {
          setBannerMessage(
            'The round has ended! Someone must click "STEP 1: Request Draw" to begin the winner selection process.'
          );
        } else if (roundInfo.statusCode === 2 && executeStatus.canExecute) {
          setBannerMessage(
            'Draw has been requested! Someone must click "STEP 2: Execute Draw" to reveal the winner and start a new round.'
          );
        } else if (roundInfo.statusCode === 2 && !executeStatus.canExecute) {
          // Draw requested but not ready yet
          setBannerMessage(
            'Draw has been requested! Waiting for VRF to be ready (must wait 2 blocks).'
          );
        }
      } else {
        setShowBanner(false);
      }
    };

    checkState();
    const interval = setInterval(checkState, 3000);
    return () => clearInterval(interval);
  }, [roundInfo, canRequestDraw, canExecuteDraw]);

  const handleRequestDraw = async () => {
    const success = await requestDraw();
    if (success) {
      console.log('Draw requested from banner');
    }
  };

  const handleExecuteDraw = async () => {
    const success = await executeDraw();
    if (success) {
      console.log('Draw executed from banner');
    }
  };

  if (!showBanner) return null;

  return (
    <div style={{
      backgroundColor: '#78350f',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px'
    }}>
      <div style={{ flex: 1, minWidth: '300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>⚠️</span>
          <h3 style={{ margin: 0, color: '#fbbf24' }}>Action Required - Round Ended</h3>
        </div>
        <p style={{ margin: 0, color: '#fde68a', fontSize: '0.95rem' }}>
          {bannerMessage}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {drawState.canRequest && (
          <button
            className="btn"
            onClick={handleRequestDraw}
            disabled={loading}
            style={{
              backgroundColor: '#f59e0b',
              color: '#000',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? '⏳ Processing...' : '⚡ STEP 1: Request Draw'}
          </button>
        )}

        {drawState.canExecute && (
          <button
            className="btn"
            onClick={handleExecuteDraw}
            disabled={loading}
            style={{
              backgroundColor: '#10b981',
              color: '#000',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? '⏳ Processing...' : '🎲 STEP 2: Execute Draw'}
          </button>
        )}
      </div>
    </div>
  );
}
