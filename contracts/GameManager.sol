// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameManager
 * @notice Manages the Blue Casino game registry - enables/disables games dynamically
 * @dev Allows admin to add games, toggle visibility, and rotate featured games
 */
contract GameManager is Ownable, ReentrancyGuard {

    // ============ Structs ============

    struct Game {
        string id;              // Unique identifier (e.g., "raffle", "slots")
        string name;            // Display name
        string description;     // Short description
        address contractAddress; // Game contract address
        bool enabled;           // Can users play?
        bool visible;           // Show in UI? (for "coming soon")
        bool featured;          // Highlight on homepage?
        uint256 sortOrder;      // Display order
        uint256 addedAt;        // Timestamp when added
    }

    // ============ State Variables ============

    /// @notice All registered game IDs
    string[] public gameIds;

    /// @notice Game data by ID
    mapping(string => Game) public games;

    /// @notice Quick lookup for game existence
    mapping(string => bool) public gameExists;

    // ============ Events ============

    event GameAdded(
        string indexed id,
        string name,
        address contractAddress,
        bool enabled,
        bool visible
    );

    event GameRemoved(string indexed id);

    event GameEnabledChanged(string indexed id, bool enabled);

    event GameVisibleChanged(string indexed id, bool visible);

    event GameFeaturedChanged(string indexed id, bool featured);

    event GameUpdated(
        string indexed id,
        string name,
        string description,
        address contractAddress
    );

    event GameSortOrderChanged(string indexed id, uint256 sortOrder);

    // ============ Errors ============

    error GameAlreadyExists(string id);
    error GameNotFound(string id);
    error EmptyGameId();
    error ZeroAddress();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Admin Functions ============

    /**
     * @notice Add a new game to the registry
     * @param id Unique game identifier
     * @param name Display name
     * @param description Short description
     * @param contractAddress Game contract address
     * @param enabled Whether game is playable
     * @param visible Whether game shows in UI
     * @param featured Whether game is highlighted
     * @param sortOrder Display order (lower = first)
     */
    function addGame(
        string calldata id,
        string calldata name,
        string calldata description,
        address contractAddress,
        bool enabled,
        bool visible,
        bool featured,
        uint256 sortOrder
    ) external onlyOwner {
        if (bytes(id).length == 0) revert EmptyGameId();
        if (gameExists[id]) revert GameAlreadyExists(id);
        if (contractAddress == address(0)) revert ZeroAddress();

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
        gameExists[id] = true;

        emit GameAdded(id, name, contractAddress, enabled, visible);
    }

    /**
     * @notice Remove a game from the registry
     * @param id Game identifier to remove
     */
    function removeGame(string calldata id) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);

        // Remove from gameIds array
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (keccak256(bytes(gameIds[i])) == keccak256(bytes(id))) {
                gameIds[i] = gameIds[gameIds.length - 1];
                gameIds.pop();
                break;
            }
        }

        delete games[id];
        gameExists[id] = false;

        emit GameRemoved(id);
    }

    /**
     * @notice Toggle whether a game is enabled (playable)
     * @param id Game identifier
     * @param enabled New enabled state
     */
    function setGameEnabled(string calldata id, bool enabled) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);
        games[id].enabled = enabled;
        emit GameEnabledChanged(id, enabled);
    }

    /**
     * @notice Toggle whether a game is visible in UI
     * @param id Game identifier
     * @param visible New visible state
     */
    function setGameVisible(string calldata id, bool visible) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);
        games[id].visible = visible;
        emit GameVisibleChanged(id, visible);
    }

    /**
     * @notice Toggle whether a game is featured on homepage
     * @param id Game identifier
     * @param featured New featured state
     */
    function setGameFeatured(string calldata id, bool featured) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);
        games[id].featured = featured;
        emit GameFeaturedChanged(id, featured);
    }

    /**
     * @notice Update game sort order
     * @param id Game identifier
     * @param sortOrder New sort order
     */
    function setGameSortOrder(string calldata id, uint256 sortOrder) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);
        games[id].sortOrder = sortOrder;
        emit GameSortOrderChanged(id, sortOrder);
    }

    /**
     * @notice Update game metadata
     * @param id Game identifier
     * @param name New display name
     * @param description New description
     * @param contractAddress New contract address
     */
    function updateGame(
        string calldata id,
        string calldata name,
        string calldata description,
        address contractAddress
    ) external onlyOwner {
        if (!gameExists[id]) revert GameNotFound(id);
        if (contractAddress == address(0)) revert ZeroAddress();

        games[id].name = name;
        games[id].description = description;
        games[id].contractAddress = contractAddress;

        emit GameUpdated(id, name, description, contractAddress);
    }

    /**
     * @notice Batch update multiple games' enabled state
     * @param ids Array of game identifiers
     * @param enabledStates Array of enabled states
     */
    function batchSetEnabled(
        string[] calldata ids,
        bool[] calldata enabledStates
    ) external onlyOwner {
        require(ids.length == enabledStates.length, "Array length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            if (!gameExists[ids[i]]) revert GameNotFound(ids[i]);
            games[ids[i]].enabled = enabledStates[i];
            emit GameEnabledChanged(ids[i], enabledStates[i]);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of registered games
     * @return count Number of games
     */
    function getGameCount() external view returns (uint256) {
        return gameIds.length;
    }

    /**
     * @notice Get all game IDs
     * @return Array of game IDs
     */
    function getAllGameIds() external view returns (string[] memory) {
        return gameIds;
    }

    /**
     * @notice Get full game data by ID
     * @param id Game identifier
     * @return Game struct
     */
    function getGame(string calldata id) external view returns (Game memory) {
        if (!gameExists[id]) revert GameNotFound(id);
        return games[id];
    }

    /**
     * @notice Get all enabled games
     * @return Array of enabled Game structs
     */
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

    /**
     * @notice Get all visible games (for UI display)
     * @return Array of visible Game structs
     */
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

    /**
     * @notice Get all featured games
     * @return Array of featured Game structs
     */
    function getFeaturedGames() external view returns (Game[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].featured && games[gameIds[i]].visible) count++;
        }

        Game[] memory featuredGames = new Game[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (games[gameIds[i]].featured && games[gameIds[i]].visible) {
                featuredGames[index] = games[gameIds[i]];
                index++;
            }
        }

        return featuredGames;
    }

    /**
     * @notice Get all games (for admin panel)
     * @return Array of all Game structs
     */
    function getAllGames() external view returns (Game[] memory) {
        Game[] memory allGames = new Game[](gameIds.length);
        for (uint256 i = 0; i < gameIds.length; i++) {
            allGames[i] = games[gameIds[i]];
        }
        return allGames;
    }

    /**
     * @notice Check if a game is playable (enabled + visible)
     * @param id Game identifier
     * @return bool True if game can be played
     */
    function isGamePlayable(string calldata id) external view returns (bool) {
        if (!gameExists[id]) return false;
        return games[id].enabled && games[id].visible;
    }
}
