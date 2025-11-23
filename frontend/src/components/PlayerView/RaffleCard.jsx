import React, { useState, useEffect } from 'react';

export function RaffleCard({ roundInfo, userTickets }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!roundInfo || roundInfo.statusCode !== 1) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      if (roundInfo.timeRemaining <= 0) {
        setTimeLeft('Time is up!');
        return;
      }

      const minutes = Math.floor(roundInfo.timeRemaining / 60);
      const seconds = roundInfo.timeRemaining % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [roundInfo]);

  if (!roundInfo) {
    return (
      <div className="raffle-card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading raffle information...</p>
        </div>
      </div>
    );
  }

  const getStatusClass = () => {
    switch (roundInfo.statusCode) {
      case 0: return 'status-waiting';
      case 1: return 'status-active';
      case 2: return 'status-drawing';
      case 3: return 'status-complete';
      default: return 'status-waiting';
    }
  };

  return (
    <div className="raffle-card">
      <h2>Round #{roundInfo.roundId}</h2>
      <span className={`status-badge ${getStatusClass()}`}>
        {roundInfo.status}
      </span>

      {roundInfo.statusCode === 1 && timeLeft && (
        <div className="timer">
          <div className="timer-display">{timeLeft}</div>
          <div className="timer-label">Time Remaining</div>
        </div>
      )}

      <div className="round-stats">
        <div className="stat-item">
          <div className="stat-label">Prize Pool</div>
          <div className="stat-value">{parseFloat(roundInfo.prizePool).toFixed(2)} BLUE</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{parseFloat(roundInfo.totalTickets).toFixed(0)}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Participants</div>
          <div className="stat-value">{roundInfo.uniqueWallets}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Your Tickets</div>
          <div className="stat-value">{parseFloat(userTickets).toFixed(0)}</div>
        </div>
      </div>

      {roundInfo.statusCode === 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#f59e0b' }}>
          <p>⏳ Waiting for {2 - parseInt(roundInfo.uniqueWallets)} more player(s) to start the round</p>
        </div>
      )}

      {roundInfo.statusCode === 2 && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#3b82f6' }}>
          <p>🎲 Drawing winner... Please wait for the draw to complete!</p>
        </div>
      )}
    </div>
  );
}
