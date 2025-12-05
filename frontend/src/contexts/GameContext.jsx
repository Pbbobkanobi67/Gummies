import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';

// Game Manager ABI (simplified for frontend)
const GAME_MANAGER_ABI = [
  "function getAllGames() view returns (tuple(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder, uint256 addedAt)[])",
  "function getVisibleGames() view returns (tuple(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder, uint256 addedAt)[])",
  "function getEnabledGames() view returns (tuple(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder, uint256 addedAt)[])",
  "function getFeaturedGames() view returns (tuple(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder, uint256 addedAt)[])",
  "function getGame(string id) view returns (tuple(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder, uint256 addedAt))",
  "function isGamePlayable(string id) view returns (bool)",
  "function owner() view returns (address)",
  "function setGameEnabled(string id, bool enabled)",
  "function setGameVisible(string id, bool visible)",
  "function setGameFeatured(string id, bool featured)",
  "function addGame(string id, string name, string description, address contractAddress, bool enabled, bool visible, bool featured, uint256 sortOrder)",
  "function removeGame(string id)",
  "event GameEnabledChanged(string indexed id, bool enabled)",
  "event GameVisibleChanged(string indexed id, bool visible)",
  "event GameFeaturedChanged(string indexed id, bool featured)",
  "event GameAdded(string indexed id, string name, address contractAddress, bool enabled, bool visible)"
];

// Game icons mapping
const GAME_ICONS = {
  raffle: '🎰',
  slots: '🎲',
  default: '🎮'
};

// Default games (fallback when contract not deployed)
const DEFAULT_GAMES = [
  {
    id: 'raffle',
    name: 'Blue Raffle',
    description: 'Provably fair raffle with blockhash randomness',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: true,
    visible: true,
    featured: true,
    sortOrder: 0,
    addedAt: Date.now()
  },
  {
    id: 'slots',
    name: 'Blue Slots',
    description: '3-reel slot machine with gBLUE holder bonuses',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: false,  // Hidden by default
    visible: false,  // Not visible in UI
    featured: false,
    sortOrder: 1,
    addedAt: Date.now()
  }
];

const GameContext = createContext(null);

export function GameProvider({ children, provider, signer, account }) {
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Game Manager contract address - update after deployment
  const GAME_MANAGER_ADDRESS = import.meta.env.VITE_GAME_MANAGER_ADDRESS || null;

  // Initialize contract
  useEffect(() => {
    if (!provider || !GAME_MANAGER_ADDRESS) {
      setLoading(false);
      return;
    }

    try {
      const gameManager = new ethers.Contract(
        GAME_MANAGER_ADDRESS,
        GAME_MANAGER_ABI,
        signer || provider
      );
      setContract(gameManager);
    } catch (err) {
      console.error('Failed to initialize GameManager:', err);
      setError('Failed to connect to Game Manager');
      setLoading(false);
    }
  }, [provider, signer, GAME_MANAGER_ADDRESS]);

  // Check if user is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!contract || !account) {
        setIsOwner(false);
        return;
      }

      try {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error('Error checking owner:', err);
        setIsOwner(false);
      }
    };

    checkOwner();
  }, [contract, account]);

  // Fetch games from contract
  useEffect(() => {
    const fetchGames = async () => {
      if (!contract) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allGames = await contract.getAllGames();

        const formattedGames = allGames.map(game => ({
          id: game.id,
          name: game.name,
          description: game.description,
          contractAddress: game.contractAddress,
          enabled: game.enabled,
          visible: game.visible,
          featured: game.featured,
          sortOrder: Number(game.sortOrder),
          addedAt: Number(game.addedAt) * 1000
        }));

        // Sort by sortOrder
        formattedGames.sort((a, b) => a.sortOrder - b.sortOrder);

        setGames(formattedGames.length > 0 ? formattedGames : DEFAULT_GAMES);
        setError(null);
      } catch (err) {
        console.error('Error fetching games:', err);
        // Use default games as fallback
        setGames(DEFAULT_GAMES);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [contract]);

  // Get visible games (for navigation)
  const visibleGames = useMemo(() => {
    return games.filter(game => game.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [games]);

  // Get enabled games (playable)
  const enabledGames = useMemo(() => {
    return games.filter(game => game.enabled && game.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [games]);

  // Get featured games (for homepage)
  const featuredGames = useMemo(() => {
    return games.filter(game => game.featured && game.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [games]);

  // Check if a specific game is playable
  const isGamePlayable = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game ? game.enabled && game.visible : false;
  };

  // Get game by ID
  const getGame = (gameId) => {
    return games.find(g => g.id === gameId);
  };

  // Get game icon
  const getGameIcon = (gameId) => {
    return GAME_ICONS[gameId] || GAME_ICONS.default;
  };

  // Admin: Toggle game enabled
  const setGameEnabled = async (gameId, enabled) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    const tx = await contract.setGameEnabled(gameId, enabled);
    await tx.wait();

    // Update local state
    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, enabled } : game
    ));
  };

  // Admin: Toggle game visible
  const setGameVisible = async (gameId, visible) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    const tx = await contract.setGameVisible(gameId, visible);
    await tx.wait();

    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, visible } : game
    ));
  };

  // Admin: Toggle game featured
  const setGameFeatured = async (gameId, featured) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    const tx = await contract.setGameFeatured(gameId, featured);
    await tx.wait();

    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, featured } : game
    ));
  };

  // Admin: Add new game
  const addGame = async (gameData) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    const tx = await contract.addGame(
      gameData.id,
      gameData.name,
      gameData.description,
      gameData.contractAddress,
      gameData.enabled,
      gameData.visible,
      gameData.featured,
      gameData.sortOrder
    );
    await tx.wait();

    // Refresh games
    const allGames = await contract.getAllGames();
    setGames(allGames.map(game => ({
      id: game.id,
      name: game.name,
      description: game.description,
      contractAddress: game.contractAddress,
      enabled: game.enabled,
      visible: game.visible,
      featured: game.featured,
      sortOrder: Number(game.sortOrder),
      addedAt: Number(game.addedAt) * 1000
    })));
  };

  // Admin: Remove game
  const removeGame = async (gameId) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    const tx = await contract.removeGame(gameId);
    await tx.wait();

    setGames(prev => prev.filter(game => game.id !== gameId));
  };

  // For development: manually toggle game (without contract)
  const devToggleGame = (gameId, field, value) => {
    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, [field]: value } : game
    ));
  };

  const value = {
    // State
    games,
    visibleGames,
    enabledGames,
    featuredGames,
    loading,
    error,
    isOwner,
    contract,

    // Methods
    isGamePlayable,
    getGame,
    getGameIcon,

    // Admin methods
    setGameEnabled,
    setGameVisible,
    setGameFeatured,
    addGame,
    removeGame,

    // Dev helper
    devToggleGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}

export { GAME_ICONS, DEFAULT_GAMES };
