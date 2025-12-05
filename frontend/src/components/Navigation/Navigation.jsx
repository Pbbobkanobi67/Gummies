import React from 'react';
import { NavLink } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';

// Game icons mapping
const GAME_ICONS = {
  raffle: '🎰',
  slots: '🎲',
  default: '🎮'
};

// Game routes mapping
const GAME_ROUTES = {
  raffle: '/',
  slots: '/slots'
};

export function Navigation({ account, isOwner }) {
  const { visibleGames, loading } = useGameContext();

  return (
    <nav className="navigation">
      <div className="nav-links">
        {/* Dynamic game links from GameContext */}
        {visibleGames.map((game) => {
          const icon = GAME_ICONS[game.id] || GAME_ICONS.default;
          const route = GAME_ROUTES[game.id] || `/${game.id}`;

          return (
            <NavLink
              key={game.id}
              to={route}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${!game.enabled ? 'coming-soon' : ''}`
              }
              title={!game.enabled ? 'Coming Soon!' : game.name}
            >
              {icon} {game.name}
              {!game.enabled && <span className="coming-soon-badge">Soon</span>}
            </NavLink>
          );
        })}

        {/* Analytics - always visible */}
        <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📊 Analytics
        </NavLink>

        {/* Admin - only for owner */}
        {isOwner && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            ⚙️ Admin
          </NavLink>
        )}
      </div>
      {account && (
        <div className="nav-account">
          <span className="nav-address">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      )}

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
