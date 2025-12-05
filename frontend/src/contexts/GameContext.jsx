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
  dice: '🎲',
  progressive: '🎰',
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

// Default games (fallback when contract not available)
// These match the existing Blue Casino games
const DEFAULT_GAMES = [
  {
    id: 'dice',
    name: 'Classic Dice',
    description: 'Roll the dice with 5 bet types. Exact number, over/under, odd/even.',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: true,
    visible: true,
    featured: true,
    sortOrder: 0,
    addedAt: Date.now()
  },
  {
    id: 'progressive',
    name: 'Progressive',
    description: 'Match 4 dice to win the growing jackpot. Tiered payouts for partial matches.',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: true,
    visible: true,
    featured: true,
    sortOrder: 1,
    addedAt: Date.now()
  },
  {
    id: 'raffle',
    name: 'Blue Raffle',
    description: 'Buy tickets for a chance to win the prize pool. Fair and transparent draws.',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: true,
    visible: true,
    featured: true,
    sortOrder: 2,
    addedAt: Date.now()
  },
  {
    id: 'slots',
    name: 'Blue Slots',
    description: '3-reel slot machine with multiple winning combinations.',
    contractAddress: '0x0000000000000000000000000000000000000000',
    enabled: false,  // Hidden by default until ready
    visible: false,
    featured: false,
    sortOrder: 3,
    addedAt: Date.now()
  }
];

const GameContext = createContext(null);

// GameManager contract address - BSC Testnet
const GAME_MANAGER_ADDRESS = import.meta.env.VITE_GAME_MANAGER_ADDRESS || '0x0b034C11B659b357Ba820Cf2fED3A9CBcA1c223B';

export function GameProvider({ children, provider, signer, account }) {
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [useContractData, setUseContractData] = useState(false);

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

        if (allGames.length > 0) {
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
          setGames(formattedGames);
          setUseContractData(true);
        } else {
          // No games in contract, use defaults
          setGames(DEFAULT_GAMES);
          setUseContractData(false);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching games from contract:', err);
        // Use default games as fallback
        setGames(DEFAULT_GAMES);
        setUseContractData(false);
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

  // Check if a specific game is visible
  const isGameVisible = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game ? game.visible : false;
  };

  // Get game by ID
  const getGame = (gameId) => {
    return games.find(g => g.id === gameId);
  };

  // Get game icon
  const getGameIcon = (gameId) => {
    return GAME_ICONS[gameId] || GAME_ICONS.default;
  };

  // Get game route
  const getGameRoute = (gameId) => {
    return GAME_ROUTES[gameId] || `/${gameId}`;
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

  // Refresh games from contract
  const refreshGames = async () => {
    if (!contract) return;

    try {
      const allGames = await contract.getAllGames();
      if (allGames.length > 0) {
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
        formattedGames.sort((a, b) => a.sortOrder - b.sortOrder);
        setGames(formattedGames);
      }
    } catch (err) {
      console.error('Error refreshing games:', err);
    }
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
    useContractData,

    // Constants
    GAME_ICONS,
    GAME_ROUTES,

    // Methods
    isGamePlayable,
    isGameVisible,
    getGame,
    getGameIcon,
    getGameRoute,
    refreshGames,

    // Admin methods
    setGameEnabled,
    setGameVisible,
    setGameFeatured,
    addGame,
    removeGame
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

export { GAME_ICONS, GAME_ROUTES, DEFAULT_GAMES };
