import { useGameContext } from '../contexts/GameContext';

/**
 * Hook for accessing game manager functionality
 * Provides a convenient interface for components that need game management
 */
export function useGameManager() {
  const context = useGameContext();

  return {
    // State
    games: context.games,
    visibleGames: context.visibleGames,
    enabledGames: context.enabledGames,
    featuredGames: context.featuredGames,
    loading: context.loading,
    error: context.error,
    isOwner: context.isOwner,
    useContractData: context.useContractData,

    // Constants
    GAME_ICONS: context.GAME_ICONS,
    GAME_ROUTES: context.GAME_ROUTES,

    // Methods
    isGamePlayable: context.isGamePlayable,
    isGameVisible: context.isGameVisible,
    getGame: context.getGame,
    getGameIcon: context.getGameIcon,
    getGameRoute: context.getGameRoute,
    refreshGames: context.refreshGames,

    // Admin methods (require owner)
    setGameEnabled: context.setGameEnabled,
    setGameVisible: context.setGameVisible,
    setGameFeatured: context.setGameFeatured,
    addGame: context.addGame,
    removeGame: context.removeGame
  };
}

/**
 * Hook to check if a specific game is available
 */
export function useGameAvailable(gameId) {
  const { isGamePlayable, isGameVisible, getGame } = useGameContext();

  const game = getGame(gameId);
  const isPlayable = isGamePlayable(gameId);
  const isVisible = isGameVisible(gameId);

  return {
    game,
    isPlayable,
    isVisible,
    isEnabled: game?.enabled ?? false,
    isFeatured: game?.featured ?? false
  };
}

/**
 * Hook to get active games for navigation
 */
export function useActiveGames() {
  const { visibleGames, enabledGames, getGameIcon, getGameRoute } = useGameContext();

  return {
    visibleGames,
    enabledGames,
    getGameIcon,
    getGameRoute
  };
}

export default useGameManager;
