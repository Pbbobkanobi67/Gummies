import React from 'react';
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="navigation">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        🎲 Classic Dice
      </NavLink>
      <NavLink to="/progressive" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        🎰 Progressive
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        History
      </NavLink>
      <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Admin
      </NavLink>
    </nav>
  );
}

export default Navigation;
