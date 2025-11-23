import React from 'react';
import { NavLink } from 'react-router-dom';

export function Navigation({ account, isOwner }) {
  return (
    <nav className="navigation">
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          🎰 Raffle
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📊 Analytics
        </NavLink>
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
    </nav>
  );
}
