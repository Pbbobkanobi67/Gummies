# Blue Casino - Game Manager Framework

## Multi-Game Platform Architecture

*Enable, Disable, and Rotate Games Dynamically*

---

## Overview

The Game Manager is a framework that allows admins to:
- **Enable/Disable** games without redeploying
- **Add new games** to the platform easily
- **Feature games** (highlight on homepage)
- **Set game order** (which appears first)
- **Hide games** (built but not launched)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BLUE CASINO PLATFORM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    GAME MANAGER (Contract)                   │   │
│  │                                                              │   │
│  │  games[] ─────────────────────────────────────────────────  │   │
│  │  │                                                          │   │
│  │  ├── BlueRaffle    { enabled: true,  featured: true  }     │   │
│  │  ├── BlueSlots     { enabled: false, featured: false }     │   │
│  │  ├── BlueCoinflip  { enabled: false, featured: false }     │   │
│  │  └── BluePoker     { enabled: false, featured: false }     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND GAME ROUTER                      │   │
│  │                                                              │   │
│  │  • Reads enabled games from contract                        │   │
│  │  • Only renders enabled games in navigation                 │   │
│  │  • Shows "Coming Soon" for disabled but visible games       │   │
│  │  • Admin panel to toggle games                              │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Game Registry Contract

### GameManager.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GameManager is Ownable {

    struct Game {
        string id;              // "raffle", "slots", "coinflip"
        string name;            // "Blue Raffle"
        string description;     // "Provably fair raffle game"
        address contractAddress;// Game contract address
        bool enabled;           // Can users play?
        bool visible;           // Show in UI? (for "coming soon")
        bool featured;          // Highlight on homepage?
        uint256 sortOrder;      // Display order
        uint256 addedAt;        // Timestamp added
    }

    mapping(string => Game) public games;
    string[] public gameIds;

    event GameAdded(string indexed id, string name, address contractAddress);
    event GameEnabled(string indexed id, bool enabled);
    event GameVisibilityChanged(string indexed id, bool visible);
    event GameFeatured(string indexed id, bool featured);
    event GameRemoved(string indexed id);

    constructor() Ownable(msg.sender) {}

    // Add a new game to the platform
    function addGame(
        string memory id,
        string memory name,
        string memory description,
        address contractAddress,
        bool enabled,
        bool visible,
        bool featured,
        uint256 sortOrder
    ) external onlyOwner {
        require(bytes(games[id].id).length == 0, "Game already exists");

        games[id] = Game({
            id: id,
            name: name,
            description: description,
            contractAddress: contractAddress,
            enabled: enabled,
            visible: visible,
            featured: featured,
            sortOrder: sortOrder,
            addedAt: block.timestamp
        });

        gameIds.push(id);
        emit GameAdded(id, name, contractAddress);
    }

    // Enable or disable a game
    function setGameEnabled(string memory id, bool enabled) external onlyOwner {
        require(bytes(games[id].id).length > 0, "Game not found");
        games[id].enabled = enabled;
        emit GameEnabled(id, enabled);
    }

    // Show or hide game in UI
    function setGameVisible(string memory id, bool visible) external onlyOwner {
        require(bytes(games[id].id).length > 0, "Game not found");
        games[id].visible = visible;
        emit GameVisibilityChanged(id, visible);
    }

    // Feature or unfeature a game
    function setGameFeatured(string memory id, bool featured) external onlyOwner {
        require(bytes(games[id].id).length > 0, "Game not found");
        games[id].featured = featured;
        emit GameFeatured(id, featured);
    }

    // Update game contract address
    function setGameContract(string memory id, address contractAddress) external onlyOwner {
        require(bytes(games[id].id).length > 0, "Game not found");
        games[id].contractAddress = contractAddress;
    }

    // Update sort order
    function setGameSortOrder(string memory id, uint256 sortOrder) external onlyOwner {
        require(bytes(games[id].id).length > 0, "Game not found");
        games[id].sortOrder = sortOrder;
    }

    // Get all game IDs
    function getAllGameIds() external view returns (string[] memory) {
        return gameIds;
    }

    // Get enabled games only
    function getEnabledGames() external view returns (Game[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].enabled) count++;
        }

        Game[] memory enabledGames = new Game[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].enabled) {
                enabledGames[index] = games[gameIds[i]];
                index++;
            }
        }
        return enabledGames;
    }

    // Get visible games (for UI, includes "coming soon")
    function getVisibleGames() external view returns (Game[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].visible) count++;
        }

        Game[] memory visibleGames = new Game[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].visible) {
                visibleGames[index] = games[gameIds[i]];
                index++;
            }
        }
        return visibleGames;
    }

    // Get featured games
    function getFeaturedGames() external view returns (Game[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].featured && games[gameIds[i]].enabled) count++;
        }

        Game[] memory featuredGames = new Game[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].featured && games[gameIds[i]].enabled) {
                featuredGames[index] = games[gameIds[i]];
                index++;
            }
        }
        return featuredGames;
    }

    // Check if a specific game is enabled
    function isGameEnabled(string memory id) external view returns (bool) {
        return games[id].enabled;
    }

    // Get game details
    function getGame(string memory id) external view returns (Game memory) {
        return games[id];
    }
}
```

---

## Frontend Architecture

### File Structure

```
frontend/src/
├── components/
│   ├── games/
│   │   ├── GameRouter.jsx         # Routes to correct game
│   │   ├── GameCard.jsx           # Game card for homepage
│   │   ├── ComingSoon.jsx         # Placeholder for hidden games
│   │   │
│   │   ├── raffle/
│   │   │   ├── RaffleGame.jsx     # Main raffle component
│   │   │   ├── RaffleStats.jsx
│   │   │   └── RaffleHistory.jsx
│   │   │
│   │   ├── slots/
│   │   │   ├── SlotsGame.jsx      # Main slots component
│   │   │   ├── SlotMachine.jsx    # Reel animations
│   │   │   ├── SlotsStats.jsx
│   │   │   └── PayoutTable.jsx
│   │   │
│   │   └── coinflip/              # Future game
│   │       └── ...
│   │
│   ├── admin/
│   │   ├── AdminPanel.jsx         # Admin dashboard
│   │   ├── GameManager.jsx        # Enable/disable games
│   │   └── GameSettings.jsx       # Per-game settings
│   │
│   └── layout/
│       ├── Navbar.jsx             # Dynamic game links
│       ├── Sidebar.jsx            # Game list
│       └── HomePage.jsx           # Featured games
│
├── hooks/
│   ├── useGameManager.js          # Read game registry
│   ├── useIsAdmin.js              # Check admin status
│   └── useGame.js                 # Generic game hook
│
├── contexts/
│   └── GameContext.jsx            # Game state provider
│
└── config/
    └── games.js                   # Local game config fallback
```

### GameContext.jsx

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const gameManager = useContract('GameManager');

  useEffect(() => {
    async function loadGames() {
      if (!gameManager) return;

      try {
        const visibleGames = await gameManager.getVisibleGames();
        setGames(visibleGames.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          contractAddress: g.contractAddress,
          enabled: g.enabled,
          visible: g.visible,
          featured: g.featured,
          sortOrder: Number(g.sortOrder)
        })).sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (err) {
        console.error('Failed to load games:', err);
        // Fallback to local config
        setGames(LOCAL_GAMES_CONFIG);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [gameManager]);

  const isGameEnabled = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game?.enabled || false;
  };

  return (
    <GameContext.Provider value={{ games, loading, isGameEnabled }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGames = () => useContext(GameContext);
```

### Dynamic Navbar

```jsx
import { useGames } from '../contexts/GameContext';
import { Link } from 'react-router-dom';

function Navbar() {
  const { games, loading } = useGames();

  const enabledGames = games.filter(g => g.enabled);
  const comingSoonGames = games.filter(g => g.visible && !g.enabled);

  return (
    <nav>
      <div className="logo">🎰 Blue Casino</div>

      <div className="nav-links">
        {enabledGames.map(game => (
          <Link key={game.id} to={`/games/${game.id}`}>
            {game.name}
          </Link>
        ))}

        {comingSoonGames.length > 0 && (
          <div className="coming-soon-dropdown">
            <span>Coming Soon ▼</span>
            <div className="dropdown-content">
              {comingSoonGames.map(game => (
                <span key={game.id} className="disabled">
                  {game.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

### Game Router

```jsx
import { useParams, Navigate } from 'react-router-dom';
import { useGames } from '../contexts/GameContext';
import RaffleGame from './raffle/RaffleGame';
import SlotsGame from './slots/SlotsGame';
import ComingSoon from './ComingSoon';

const GAME_COMPONENTS = {
  raffle: RaffleGame,
  slots: SlotsGame,
  // Add future games here
  coinflip: null,
  poker: null,
};

function GameRouter() {
  const { gameId } = useParams();
  const { games, isGameEnabled } = useGames();

  const game = games.find(g => g.id === gameId);

  // Game not found
  if (!game) {
    return <Navigate to="/" />;
  }

  // Game visible but not enabled (coming soon)
  if (!game.enabled) {
    return <ComingSoon game={game} />;
  }

  // Get game component
  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return <ComingSoon game={game} />;
  }

  return <GameComponent game={game} />;
}
```

### Admin Panel

```jsx
import { useState } from 'react';
import { useContract } from '../../hooks/useContract';
import { useIsAdmin } from '../../hooks/useIsAdmin';

function GameManagerAdmin() {
  const isAdmin = useIsAdmin();
  const gameManager = useContract('GameManager');
  const { games, loading } = useGames();

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  const toggleGame = async (gameId, currentState) => {
    try {
      const tx = await gameManager.setGameEnabled(gameId, !currentState);
      await tx.wait();
      // Refresh games
    } catch (err) {
      console.error('Failed to toggle game:', err);
    }
  };

  const toggleVisibility = async (gameId, currentState) => {
    try {
      const tx = await gameManager.setGameVisible(gameId, !currentState);
      await tx.wait();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const toggleFeatured = async (gameId, currentState) => {
    try {
      const tx = await gameManager.setGameFeatured(gameId, !currentState);
      await tx.wait();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  return (
    <div className="admin-panel">
      <h1>🎮 Game Manager</h1>

      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>Enabled</th>
            <th>Visible</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id}>
              <td>
                <strong>{game.name}</strong>
                <br />
                <small>{game.description}</small>
              </td>
              <td>
                <button
                  onClick={() => toggleGame(game.id, game.enabled)}
                  className={game.enabled ? 'btn-success' : 'btn-danger'}
                >
                  {game.enabled ? '✅ ON' : '❌ OFF'}
                </button>
              </td>
              <td>
                <button
                  onClick={() => toggleVisibility(game.id, game.visible)}
                  className={game.visible ? 'btn-success' : 'btn-muted'}
                >
                  {game.visible ? '👁️ Visible' : '🙈 Hidden'}
                </button>
              </td>
              <td>
                <button
                  onClick={() => toggleFeatured(game.id, game.featured)}
                  className={game.featured ? 'btn-warning' : 'btn-muted'}
                >
                  {game.featured ? '⭐ Featured' : '☆ Normal'}
                </button>
              </td>
              <td>
                <button onClick={() => openSettings(game.id)}>
                  ⚙️ Settings
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Game States

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GAME VISIBILITY MATRIX                      │
├─────────────────┬─────────────┬─────────────┬──────────────────────┤
│ enabled         │ visible     │ Result      │ Use Case             │
├─────────────────┼─────────────┼─────────────┼──────────────────────┤
│ true            │ true        │ Playable    │ Live game            │
│ false           │ true        │ Coming Soon │ Tease upcoming game  │
│ false           │ false       │ Hidden      │ In development       │
│ true            │ false       │ Hidden Live │ Soft launch/testing  │
└─────────────────┴─────────────┴─────────────┴──────────────────────┘
```

### Initial Setup for Slots

```javascript
// When deploying, register slots as:
{
  id: "slots",
  name: "Blue Slots",
  description: "Provably fair 3-reel slot machine",
  contractAddress: SLOTS_CONTRACT_ADDRESS,
  enabled: false,    // ← Not playable yet
  visible: false,    // ← Hidden from UI
  featured: false,
  sortOrder: 2
}

// Later, to tease:
await gameManager.setGameVisible("slots", true);
// Shows "Coming Soon" in navbar

// To launch:
await gameManager.setGameEnabled("slots", true);
// Now fully playable

// To feature on homepage:
await gameManager.setGameFeatured("slots", true);
```

---

## Routes Structure

```jsx
<Routes>
  {/* Home */}
  <Route path="/" element={<HomePage />} />

  {/* Dynamic game routes */}
  <Route path="/games/:gameId" element={<GameRouter />} />

  {/* Admin routes */}
  <Route path="/admin" element={<AdminPanel />}>
    <Route path="games" element={<GameManagerAdmin />} />
    <Route path="games/:gameId" element={<GameSettingsAdmin />} />
  </Route>

  {/* Legacy routes (redirect) */}
  <Route path="/raffle" element={<Navigate to="/games/raffle" />} />
</Routes>
```

---

## Adding a New Game (Developer Guide)

### Step 1: Create Game Contract

```solidity
// contracts/games/BlueCoinflip.sol
contract BlueCoinflip is Ownable, ReentrancyGuard, Pausable {
    // Game logic...
}
```

### Step 2: Create Frontend Component

```jsx
// frontend/src/components/games/coinflip/CoinflipGame.jsx
function CoinflipGame({ game }) {
  return (
    <div className="coinflip-game">
      {/* Game UI */}
    </div>
  );
}
```

### Step 3: Register in Game Router

```jsx
// frontend/src/components/games/GameRouter.jsx
const GAME_COMPONENTS = {
  raffle: RaffleGame,
  slots: SlotsGame,
  coinflip: CoinflipGame,  // ← Add here
};
```

### Step 4: Register in Contract

```javascript
await gameManager.addGame(
  "coinflip",
  "Blue Coinflip",
  "50/50 chance to double your BLUE",
  COINFLIP_CONTRACT_ADDRESS,
  false,  // enabled
  false,  // visible
  false,  // featured
  3       // sortOrder
);
```

### Step 5: Launch When Ready

```javascript
// Tease it
await gameManager.setGameVisible("coinflip", true);

// Launch it
await gameManager.setGameEnabled("coinflip", true);

// Feature it
await gameManager.setGameFeatured("coinflip", true);
```

---

## Summary

| Feature | Description |
|---------|-------------|
| **Dynamic Enable/Disable** | Toggle games on/off without redeploy |
| **Visibility Control** | Show "Coming Soon" before launch |
| **Featured Games** | Highlight on homepage |
| **Sort Order** | Control game order in nav |
| **Modular Components** | Each game is self-contained |
| **Admin Panel** | Easy management UI |
| **Fallback Config** | Works even if contract fails |

---

## Next Steps

1. [ ] Deploy GameManager contract
2. [ ] Register BlueRaffle as first game
3. [ ] Build Slots frontend (hidden)
4. [ ] Build Admin panel
5. [ ] Test enable/disable flow
6. [ ] Deploy Slots contract (disabled)
7. [ ] Launch Slots when ready

---

*Blue Casino - Modular Gaming Platform*
