import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';

// Game icons mapping (fallback)
const GAME_ICONS = {
  dice: '🎲',
  progressive: '💎',
  raffle: '🎟️',
  slots: '🎰',
  default: '🎮'
};

// Game routes mapping
const GAME_ROUTES = {
  dice: '/dice',
  progressive: '/progressive',
  raffle: '/raffle',
  slots: '/slots'
};

function Navigation() {
  const [proMode, setProMode] = useState(() => {
    const saved = localStorage.getItem('blueCasino_proMode');
    return saved === 'true';
  });

  // Get games from context (with fallback handling)
  let visibleGames = [];
  let useContractData = false;
  try {
    const gameContext = useGameContext();
    visibleGames = gameContext.visibleGames || [];
    useContractData = gameContext.useContractData;
  } catch (e) {
    // Context not available, use default nav
  }

  useEffect(() => {
    localStorage.setItem('blueCasino_proMode', proMode);
  }, [proMode]);

  // Render game nav link
  const renderGameLink = (game) => {
    const icon = GAME_ICONS[game.id] || GAME_ICONS.default;
    const route = GAME_ROUTES[game.id] || `/${game.id}`;
    const isComingSoon = !game.enabled;

    return (
      <NavLink
        key={game.id}
        to={route}
        className={({ isActive }) =>
          `nav-link ${isActive ? 'active' : ''} ${isComingSoon ? 'coming-soon' : ''}`
        }
        title={isComingSoon ? 'Coming Soon!' : game.name}
      >
        <span className="nav-icon">{icon}</span> {game.name}
        {isComingSoon && <span className="coming-soon-badge">Soon</span>}
      </NavLink>
    );
  };

  return (
    <nav className="navigation">
      <div className="nav-links">
        {/* Casino home - always visible */}
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🎰</span> Casino
        </NavLink>

        {/* Dynamic game links from GameContext */}
        {useContractData && visibleGames.length > 0 ? (
          // Use games from contract
          visibleGames.map(game => renderGameLink(game))
        ) : (
          // Fallback to static navigation
          <>
            <NavLink to="/dice" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">🎲</span> Classic Dice
            </NavLink>
            <NavLink to="/progressive" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">💎</span> Progressive
            </NavLink>
            <NavLink to="/raffle" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">🎟️</span> Raffle
            </NavLink>
          </>
        )}

        {/* History - Pro mode only */}
        {proMode && (
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📊</span> History
          </NavLink>
        )}

        {/* Faucet - always visible */}
        <NavLink to="/faucet" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🚰</span> Faucet
        </NavLink>

        {/* Docs - always visible */}
        <NavLink to="/docs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📖</span> Docs
        </NavLink>
      </div>

      <button
        className={`mode-toggle ${proMode ? 'pro' : 'basic'}`}
        onClick={() => setProMode(!proMode)}
        title={proMode ? 'Switch to Basic Mode' : 'Switch to Pro Mode'}
      >
        {proMode ? '⚡ Pro' : '✨ Basic'}
      </button>

      <style>{`
        .nav-link.coming-soon {
          opacity: 0.7;
          position: relative;
        }
        .coming-soon-badge {
          font-size: 0.6rem;
          background: #f59e0b;
          color: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>
    </nav>
  );
}

export default Navigation;
