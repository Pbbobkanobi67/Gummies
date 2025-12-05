import React, { useState, useEffect, useRef } from 'react';

function RafflePage({ wallet, raffle }) {
  const [ticketAmount, setTicketAmount] = useState('10');
  const [drawStatus, setDrawStatus] = useState({ canRequest: false, canExecute: false });
  const [previousWinner, setPreviousWinner] = useState(null);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const lastBlockchainTime = useRef(null);

  const { roundInfo, userTickets, loading, error } = raffle;

  // Sync local countdown with blockchain time and tick locally every second
  useEffect(() => {
    if (roundInfo?.timeRemaining !== undefined && roundInfo?.timeRemaining !== null) {
      // Only update from blockchain if it's a new value (not just re-render)
      if (lastBlockchainTime.current !== roundInfo.timeRemaining) {
        lastBlockchainTime.current = roundInfo.timeRemaining;
        setLocalTimeRemaining(roundInfo.timeRemaining);
      }
    }
  }, [roundInfo?.timeRemaining]);

  // Local countdown timer - ticks every second
  useEffect(() => {
    if (localTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLocalTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [localTimeRemaining > 0]);

  // Check draw status
  useEffect(() => {
    const checkDrawStatus = async () => {
      if (raffle.contract) {
        const [requestStatus, executeStatus] = await Promise.all([
          raffle.canRequestDraw(),
          raffle.canExecuteDraw()
        ]);
        setDrawStatus({
          canRequest: requestStatus.canRequest,
          requestReason: requestStatus.reason,
          canExecute: executeStatus.canExecute,
          executeReason: executeStatus.reason
        });
      }
    };
    checkDrawStatus();
    const interval = setInterval(checkDrawStatus, 5000);
    return () => clearInterval(interval);
  }, [raffle.contract, roundInfo]);

  // Fetch previous winner
  useEffect(() => {
    const fetchPreviousWinner = async () => {
      if (raffle.contract && roundInfo?.roundId > 1) {
        const winner = await raffle.getPreviousRoundWinner();
        if (winner && winner.winner !== '0x0000000000000000000000000000000000000000') {
          setPreviousWinner(winner);
        }
      }
    };
    fetchPreviousWinner();
  }, [raffle.contract, roundInfo?.roundId]);

  const handleBuyTickets = async (e) => {
    e.preventDefault();
    if (!ticketAmount) return;
    await raffle.buyTickets(ticketAmount);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Waiting': return 'status-waiting';
      case 'Active': return 'status-active';
      case 'Drawing': return 'status-drawing';
      case 'Complete': return 'status-complete';
      default: return '';
    }
  };

  if (!wallet.account) {
    return (
      <div className="raffle-page">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Blue Raffle</h2>
          <p style={{ color: 'var(--text-gray)', margin: '20px 0' }}>
            Connect your wallet to participate in the raffle
          </p>
        </div>
      </div>
    );
  }

  if (!raffle.contract) {
    return (
      <div className="raffle-page">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Blue Raffle</h2>
          <p style={{ color: 'var(--text-gray)', margin: '20px 0' }}>
            Raffle contract not deployed yet. Deploy using the deploy script.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="raffle-page">
      {/* Previous Winner Banner */}
      {previousWinner && (
        <div className="winner-banner">
          <span>Round #{previousWinner.roundId} Winner:</span>
          <span className="winner-address">
            {previousWinner.winner.slice(0, 6)}...{previousWinner.winner.slice(-4)}
          </span>
          <span className="winner-prize">{parseFloat(previousWinner.prize).toLocaleString()} BLUE</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={raffle.clearError}>Dismiss</button>
        </div>
      )}

      {/* Draw Controls - Moved to top, highlighted when action needed */}
      <div className={`card draw-controls-card ${drawStatus.canRequest || drawStatus.canExecute ? 'action-required' : ''}`}>
        <h3>🎯 Draw Controls</h3>

        {roundInfo?.status === 'Waiting' && (
          <p className="draw-info">
            ⏳ Waiting for at least 2 participants to start the countdown...
          </p>
        )}

        {roundInfo?.status === 'Active' && localTimeRemaining > 0 && (
          <p className="draw-info">
            ⏱️ Round is active. Draw can be requested after the timer ends.
          </p>
        )}

        {drawStatus.canRequest && (
          <div className="draw-action action-highlight">
            <p className="draw-info success">🚨 Round ended! Someone must trigger the draw!</p>
            <button
              className="btn btn-primary btn-large pulse-animation"
              onClick={raffle.requestDraw}
              disabled={loading}
            >
              {loading ? 'Processing...' : '🎲 Request Draw Now!'}
            </button>
          </div>
        )}

        {roundInfo?.status === 'Drawing' && !drawStatus.canExecute && (
          drawStatus.executeReason?.includes('expired') ? (
            <div className="draw-action action-highlight">
              <p className="draw-info warning">⚠️ Draw expired! The blockhash window passed. Admin must cancel and restart the round.</p>
              <button
                className="btn btn-warning btn-large"
                onClick={raffle.cancelRound}
                disabled={loading}
              >
                {loading ? 'Processing...' : '🔄 Cancel Round & Refund All'}
              </button>
              <p className="draw-note">All participants will be refunded their BLUE tokens.</p>
            </div>
          ) : (
            <p className="draw-info">
              ⏳ Draw requested. Waiting for blocks... {drawStatus.executeReason}
            </p>
          )
        )}

        {drawStatus.canExecute && (
          <div className="draw-action action-highlight">
            <p className="draw-info success">🎉 Ready to select winner!</p>
            <button
              className="btn btn-success btn-large pulse-animation"
              onClick={raffle.executeDraw}
              disabled={loading}
            >
              {loading ? 'Processing...' : '🏆 Execute Draw & Select Winner!'}
            </button>
          </div>
        )}

        {!drawStatus.canRequest && !drawStatus.canExecute && roundInfo?.status !== 'Waiting' && roundInfo?.status !== 'Active' && (
          <p className="draw-info">
            No action required at this time.
          </p>
        )}
      </div>

      {/* Round Info Card */}
      <div className="raffle-card">
        <div className="raffle-header">
          <h2>Round #{roundInfo?.roundId || 0}</h2>
          <span className={`raffle-status ${getStatusColor(roundInfo?.status)}`}>
            {roundInfo?.status || 'Loading...'}
          </span>
        </div>

        <div className="prize-pool">
          <span className="prize-label">Prize Pool</span>
          <span className="prize-value">
            {parseFloat(roundInfo?.prizePool || 0).toLocaleString()} BLUE
          </span>
        </div>

        {roundInfo?.status === 'Active' && localTimeRemaining > 0 && (
          <div className="countdown-section">
            <span className="countdown-label">Time Remaining</span>
            <span className="countdown-value">{formatTime(localTimeRemaining)}</span>
          </div>
        )}

        <div className="raffle-stats">
          <div className="raffle-stat">
            <span className="stat-label">Participants</span>
            <span className="stat-value">{roundInfo?.uniqueWallets || 0}</span>
          </div>
          <div className="raffle-stat">
            <span className="stat-label">Total Tickets</span>
            <span className="stat-value">{parseFloat(roundInfo?.totalTickets || 0).toLocaleString()}</span>
          </div>
          <div className="raffle-stat">
            <span className="stat-label">Your Tickets</span>
            <span className="stat-value highlight">{parseFloat(userTickets || 0).toLocaleString()}</span>
          </div>
        </div>

        {parseFloat(userTickets) > 0 && parseFloat(roundInfo?.totalTickets) > 0 && (
          <div className="win-chance">
            Your win chance: {((parseFloat(userTickets) / parseFloat(roundInfo.totalTickets)) * 100).toFixed(2)}%
          </div>
        )}
      </div>

      {/* Buy Tickets */}
      {(roundInfo?.statusCode === 0 || roundInfo?.statusCode === 1) && (
        <div className="card">
          <h3>Buy Tickets</h3>
          <p className="section-desc">1 BLUE = 1 Ticket (94% goes to prize pool)</p>

          <form onSubmit={handleBuyTickets}>
            <div className="ticket-input-section">
              <input
                type="number"
                value={ticketAmount}
                onChange={(e) => setTicketAmount(e.target.value)}
                placeholder="Amount (BLUE)"
                min="5"
                max="150"
                step="1"
              />
              <div className="quick-amounts">
                <button type="button" onClick={() => setTicketAmount('5')}>5</button>
                <button type="button" onClick={() => setTicketAmount('10')}>10</button>
                <button type="button" onClick={() => setTicketAmount('25')}>25</button>
                <button type="button" onClick={() => setTicketAmount('50')}>50</button>
                <button type="button" onClick={() => setTicketAmount('100')}>100</button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading || !ticketAmount}
            >
              {loading ? 'Processing...' : `Buy ${ticketAmount} Tickets`}
            </button>
          </form>

          <p className="limit-info">Min: 5 BLUE | Max: 150 BLUE per round</p>
        </div>
      )}


      {/* How It Works */}
      <div className="card">
        <h3>How Blue Raffle Works</h3>
        <div className="how-it-works-list">
          <div className="step-item">
            <span className="step-num">1</span>
            <div>
              <strong>Buy Tickets</strong>
              <p>Purchase tickets with BLUE tokens (5-150 per round)</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-num">2</span>
            <div>
              <strong>Wait for Participants</strong>
              <p>Round activates when 2+ players join, starting 5-minute countdown</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-num">3</span>
            <div>
              <strong>Draw Requested</strong>
              <p>Anyone can trigger the draw after countdown ends</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-num">4</span>
            <div>
              <strong>Winner Selected</strong>
              <p>Blockhash randomness picks winner - more tickets = higher chance</p>
            </div>
          </div>
        </div>

        <div className="distribution-info">
          <h4>Ticket Distribution</h4>
          <div className="distribution-grid">
            <div className="dist-item prize">94% Prize Pool</div>
            <div className="dist-item burn">2% Burned</div>
            <div className="dist-item dev">2% Developer</div>
            <div className="dist-item seed">1% Next Round Seed</div>
            <div className="dist-item treasury">1% Treasury</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RafflePage;
