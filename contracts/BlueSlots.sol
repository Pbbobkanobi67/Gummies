// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlueSlots
 * @notice Provably fair 3-reel slot machine using blockhash randomness
 * @dev Two-step spin process: spin() commits, reveal() executes with blockhash
 */
contract BlueSlots is Ownable, ReentrancyGuard, Pausable {

    // ============ Enums ============

    enum Symbol { BLUE, DIAMOND, FIRE, STAR, LUCKY, SEVEN }
    enum SpinStatus { Pending, Revealed, Expired, Refunded }

    // ============ Structs ============

    struct Spin {
        address player;
        uint256 betAmount;
        uint256 spinBlock;
        uint256 winAmount;
        uint8[3] symbols;       // Raw symbol positions (0-19)
        SpinStatus status;
        bool isFreeSpin;
    }

    struct PlayerStats {
        uint256 totalSpins;
        uint256 totalWagered;
        uint256 totalWon;
        uint256 biggestWin;
        uint256 freeSpinsUsed;
    }

    struct Distribution {
        uint256 houseReserveBps;  // 7000 = 70%
        uint256 treasuryBps;      // 1500 = 15%
        uint256 burnBps;          // 1000 = 10%
        uint256 jackpotPoolBps;   // 500 = 5%
    }

    // ============ Constants ============

    uint256 public constant BLOCKS_TO_WAIT = 2;
    uint256 public constant MAX_BLOCK_WAIT = 250;
    uint256 public constant SYMBOLS_PER_REEL = 20;
    uint256 public constant BPS_DENOMINATOR = 10000;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============ State Variables ============

    IERC20 public immutable blueToken;
    address public treasuryWallet;

    uint256 public minBet = 5 * 1e18;      // 5 BLUE
    uint256 public maxBet = 100 * 1e18;    // 100 BLUE
    uint256 public houseReserve;
    uint256 public jackpotPool;
    uint256 public minReserve = 1000 * 1e18; // 1000 BLUE minimum

    Distribution public distribution = Distribution({
        houseReserveBps: 7000,
        treasuryBps: 1500,
        burnBps: 1000,
        jackpotPoolBps: 500
    });

    // Payout multipliers in BPS (10000 = 1x)
    uint256 public tripleBlueMultiplier = 500000;    // 50x
    uint256 public tripleDiamondMultiplier = 250000; // 25x
    uint256 public tripleSevenMultiplier = 150000;   // 15x
    uint256 public tripleFireMultiplier = 100000;    // 10x
    uint256 public tripleLuckyMultiplier = 80000;    // 8x
    uint256 public tripleStarMultiplier = 50000;     // 5x
    uint256 public twoMatchMultiplier = 15000;       // 1.5x

    // Spin tracking
    uint256 public currentSpinId;
    mapping(uint256 => Spin) public spins;
    mapping(address => uint256[]) public playerSpinHistory;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => uint256) public pendingSpinId; // One pending spin per player

    // ============ Events ============

    event SpinStarted(
        uint256 indexed spinId,
        address indexed player,
        uint256 betAmount,
        bool isFreeSpin
    );

    event SpinRevealed(
        uint256 indexed spinId,
        address indexed player,
        uint8[3] symbols,
        Symbol[3] symbolTypes,
        uint256 winAmount
    );

    event SpinExpired(
        uint256 indexed spinId,
        address indexed player,
        uint256 refundAmount
    );

    event JackpotWon(
        uint256 indexed spinId,
        address indexed player,
        Symbol symbol,
        uint256 amount
    );

    event ReserveDeposit(address indexed from, uint256 amount);
    event ReserveWithdraw(address indexed to, uint256 amount);
    event BetLimitsUpdated(uint256 minBet, uint256 maxBet);
    event DistributionUpdated(uint256 house, uint256 treasury, uint256 burn, uint256 jackpot);

    // ============ Errors ============

    error BetTooLow(uint256 bet, uint256 minimum);
    error BetTooHigh(uint256 bet, uint256 maximum);
    error InsufficientReserve(uint256 required, uint256 available);
    error SpinNotFound(uint256 spinId);
    error SpinNotPending(uint256 spinId);
    error SpinTooEarly(uint256 currentBlock, uint256 targetBlock);
    error SpinExpiredError(uint256 spinId);
    error PendingSpinExists(uint256 spinId);
    error NotSpinOwner(address caller, address owner);
    error InvalidDistribution();
    error ZeroAddress();
    error NoPendingSpin();

    // ============ Constructor ============

    constructor(
        address _blueToken,
        address _treasury
    ) Ownable(msg.sender) {
        if (_blueToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        blueToken = IERC20(_blueToken);
        treasuryWallet = _treasury;
    }

    // ============ Player Functions ============

    /**
     * @notice Start a spin by committing bet amount
     * @param betAmount Amount of BLUE to bet
     * @return spinId The ID of this spin
     */
    function spin(uint256 betAmount) external nonReentrant whenNotPaused returns (uint256 spinId) {
        // Check for existing pending spin
        if (pendingSpinId[msg.sender] != 0) {
            uint256 existingId = pendingSpinId[msg.sender];
            if (spins[existingId].status == SpinStatus.Pending) {
                revert PendingSpinExists(existingId);
            }
        }

        // Validate bet
        if (betAmount < minBet) revert BetTooLow(betAmount, minBet);
        if (betAmount > maxBet) revert BetTooHigh(betAmount, maxBet);

        // Check reserve can cover max payout
        uint256 maxPayout = (betAmount * tripleBlueMultiplier) / BPS_DENOMINATOR;
        if (maxPayout > houseReserve) {
            revert InsufficientReserve(maxPayout, houseReserve);
        }

        // Transfer BLUE from player
        blueToken.transferFrom(msg.sender, address(this), betAmount);

        // Create spin
        currentSpinId++;
        spinId = currentSpinId;

        spins[spinId] = Spin({
            player: msg.sender,
            betAmount: betAmount,
            spinBlock: block.number,
            winAmount: 0,
            symbols: [uint8(0), uint8(0), uint8(0)],
            status: SpinStatus.Pending,
            isFreeSpin: false
        });

        pendingSpinId[msg.sender] = spinId;
        playerSpinHistory[msg.sender].push(spinId);

        emit SpinStarted(spinId, msg.sender, betAmount, false);
    }

    /**
     * @notice Reveal spin result and collect winnings
     * @param spinId ID of the spin to reveal
     * @return winAmount Amount won (0 if loss)
     */
    function reveal(uint256 spinId) external nonReentrant returns (uint256 winAmount) {
        Spin storage spinData = spins[spinId];

        if (spinData.player == address(0)) revert SpinNotFound(spinId);
        if (spinData.status != SpinStatus.Pending) revert SpinNotPending(spinId);
        if (spinData.player != msg.sender) revert NotSpinOwner(msg.sender, spinData.player);

        uint256 targetBlock = spinData.spinBlock + BLOCKS_TO_WAIT;

        // Check timing
        if (block.number < targetBlock) {
            revert SpinTooEarly(block.number, targetBlock);
        }

        // Check expiration
        if (block.number > spinData.spinBlock + MAX_BLOCK_WAIT) {
            // Refund on expiration
            spinData.status = SpinStatus.Expired;
            uint256 refund = spinData.betAmount;
            pendingSpinId[msg.sender] = 0;

            blueToken.transfer(msg.sender, refund);
            emit SpinExpired(spinId, msg.sender, refund);
            return 0;
        }

        // Generate symbols
        uint8[3] memory symbolPositions = _generateSymbols(spinId, spinData);
        spinData.symbols = symbolPositions;

        // Convert to symbol types
        Symbol[3] memory symbolTypes = [
            _getSymbolType(symbolPositions[0]),
            _getSymbolType(symbolPositions[1]),
            _getSymbolType(symbolPositions[2])
        ];

        // Calculate payout
        winAmount = _calculatePayout(symbolTypes, spinData.betAmount);
        spinData.winAmount = winAmount;
        spinData.status = SpinStatus.Revealed;
        pendingSpinId[msg.sender] = 0;

        // Update stats
        PlayerStats storage stats = playerStats[msg.sender];
        stats.totalSpins++;
        stats.totalWagered += spinData.betAmount;
        stats.totalWon += winAmount;
        if (winAmount > stats.biggestWin) {
            stats.biggestWin = winAmount;
        }

        if (winAmount > 0) {
            // Player wins - pay from reserve
            houseReserve -= winAmount;
            blueToken.transfer(msg.sender, winAmount);

            // Check for jackpot
            if (symbolTypes[0] == Symbol.BLUE && symbolTypes[1] == Symbol.BLUE && symbolTypes[2] == Symbol.BLUE) {
                emit JackpotWon(spinId, msg.sender, Symbol.BLUE, winAmount);
            }
        } else {
            // Player loses - distribute bet
            _distributeLoss(spinData.betAmount);
        }

        emit SpinRevealed(spinId, msg.sender, symbolPositions, symbolTypes, winAmount);
    }

    /**
     * @notice Refund an expired spin
     * @param spinId ID of the expired spin
     */
    function refundExpiredSpin(uint256 spinId) external nonReentrant {
        Spin storage spinData = spins[spinId];

        if (spinData.player == address(0)) revert SpinNotFound(spinId);
        if (spinData.status != SpinStatus.Pending) revert SpinNotPending(spinId);
        if (block.number <= spinData.spinBlock + MAX_BLOCK_WAIT) {
            revert SpinTooEarly(block.number, spinData.spinBlock + MAX_BLOCK_WAIT);
        }

        spinData.status = SpinStatus.Refunded;
        uint256 refund = spinData.betAmount;

        if (pendingSpinId[spinData.player] == spinId) {
            pendingSpinId[spinData.player] = 0;
        }

        blueToken.transfer(spinData.player, refund);
        emit SpinExpired(spinId, spinData.player, refund);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a spin can be revealed
     * @param spinId ID of the spin
     * @return canRevealNow Whether reveal can be called
     * @return reason Explanation if cannot reveal
     */
    function canReveal(uint256 spinId) external view returns (bool canRevealNow, string memory reason) {
        Spin storage spinData = spins[spinId];

        if (spinData.player == address(0)) {
            return (false, "Spin not found");
        }
        if (spinData.status != SpinStatus.Pending) {
            return (false, "Spin already resolved");
        }

        uint256 targetBlock = spinData.spinBlock + BLOCKS_TO_WAIT;

        if (block.number < targetBlock) {
            return (false, "Wait for more blocks");
        }
        if (block.number > spinData.spinBlock + MAX_BLOCK_WAIT) {
            return (false, "Spin expired - call refundExpiredSpin");
        }

        return (true, "Ready to reveal");
    }

    /**
     * @notice Get blocks remaining before reveal
     * @param spinId ID of the spin
     * @return blocks Number of blocks to wait (0 if ready)
     */
    function blocksUntilReveal(uint256 spinId) external view returns (uint256 blocks) {
        Spin storage spinData = spins[spinId];
        if (spinData.player == address(0)) return 0;

        uint256 targetBlock = spinData.spinBlock + BLOCKS_TO_WAIT;
        if (block.number >= targetBlock) return 0;
        return targetBlock - block.number;
    }

    /**
     * @notice Get a player's pending spin ID
     * @param player Address to check
     * @return spinId Pending spin ID (0 if none)
     */
    function getPendingSpin(address player) external view returns (uint256) {
        return pendingSpinId[player];
    }

    /**
     * @notice Get spin details
     * @param spinId ID of the spin
     * @return Spin struct
     */
    function getSpinResult(uint256 spinId) external view returns (Spin memory) {
        return spins[spinId];
    }

    /**
     * @notice Get player statistics
     * @param player Address to check
     * @return PlayerStats struct
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    /**
     * @notice Get player's spin history
     * @param player Address to check
     * @param limit Max number of spins to return
     * @return spinIds Array of spin IDs (most recent first)
     */
    function getPlayerHistory(address player, uint256 limit) external view returns (uint256[] memory spinIds) {
        uint256[] storage history = playerSpinHistory[player];
        uint256 count = history.length;
        if (count == 0) return new uint256[](0);

        uint256 returnCount = count < limit ? count : limit;
        spinIds = new uint256[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            spinIds[i] = history[count - 1 - i]; // Most recent first
        }
    }

    /**
     * @notice Calculate potential payout for given symbols
     * @param symbolTypes Array of 3 symbol types
     * @param betAmount Bet amount
     * @return payout Potential winnings
     */
    function calculatePotentialPayout(
        Symbol[3] calldata symbolTypes,
        uint256 betAmount
    ) external view returns (uint256) {
        return _calculatePayout(symbolTypes, betAmount);
    }

    /**
     * @notice Get symbol type from position (0-19)
     * @param position Raw reel position
     * @return Symbol type
     */
    function getSymbolFromPosition(uint8 position) external pure returns (Symbol) {
        return _getSymbolType(position);
    }

    /**
     * @notice Get max bet based on current reserve
     * @return maxAllowed Maximum bet amount
     */
    function getMaxBetForReserve() external view returns (uint256 maxAllowed) {
        // Max bet = reserve / max_multiplier (so we can always pay jackpot)
        uint256 reserveBased = (houseReserve * BPS_DENOMINATOR) / tripleBlueMultiplier;
        return reserveBased < maxBet ? reserveBased : maxBet;
    }

    // ============ Internal Functions ============

    /**
     * @dev Generate random symbols using blockhash
     */
    function _generateSymbols(
        uint256 spinId,
        Spin storage spinData
    ) internal view returns (uint8[3] memory symbols) {
        uint256 targetBlock = spinData.spinBlock + BLOCKS_TO_WAIT;
        bytes32 blockHash = blockhash(targetBlock);

        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockHash,
            spinData.player,
            spinData.betAmount,
            spinId
        )));

        symbols[0] = uint8(seed % SYMBOLS_PER_REEL);
        symbols[1] = uint8((seed >> 8) % SYMBOLS_PER_REEL);
        symbols[2] = uint8((seed >> 16) % SYMBOLS_PER_REEL);
    }

    /**
     * @dev Convert position (0-19) to symbol type
     * Distribution: BLUE(2), Diamond(3), Fire(4), Star(5), Lucky(3), Seven(3) = 20
     */
    function _getSymbolType(uint8 position) internal pure returns (Symbol) {
        if (position < 2) return Symbol.BLUE;      // 0-1   (10%)
        if (position < 5) return Symbol.DIAMOND;   // 2-4   (15%)
        if (position < 9) return Symbol.FIRE;      // 5-8   (20%)
        if (position < 14) return Symbol.STAR;     // 9-13  (25%)
        if (position < 17) return Symbol.LUCKY;    // 14-16 (15%)
        return Symbol.SEVEN;                        // 17-19 (15%)
    }

    /**
     * @dev Calculate payout for given symbols and bet
     */
    function _calculatePayout(
        Symbol[3] memory symbolTypes,
        uint256 betAmount
    ) internal view returns (uint256) {
        // Check for triple match
        if (symbolTypes[0] == symbolTypes[1] && symbolTypes[1] == symbolTypes[2]) {
            uint256 multiplier;

            if (symbolTypes[0] == Symbol.BLUE) {
                multiplier = tripleBlueMultiplier;
            } else if (symbolTypes[0] == Symbol.DIAMOND) {
                multiplier = tripleDiamondMultiplier;
            } else if (symbolTypes[0] == Symbol.SEVEN) {
                multiplier = tripleSevenMultiplier;
            } else if (symbolTypes[0] == Symbol.FIRE) {
                multiplier = tripleFireMultiplier;
            } else if (symbolTypes[0] == Symbol.LUCKY) {
                multiplier = tripleLuckyMultiplier;
            } else {
                multiplier = tripleStarMultiplier;
            }

            return (betAmount * multiplier) / BPS_DENOMINATOR;
        }

        // Check for two-match (left pair or right pair)
        if (symbolTypes[0] == symbolTypes[1] || symbolTypes[1] == symbolTypes[2]) {
            return (betAmount * twoMatchMultiplier) / BPS_DENOMINATOR;
        }

        // No match
        return 0;
    }

    /**
     * @dev Distribute lost bet according to distribution settings
     */
    function _distributeLoss(uint256 amount) internal {
        uint256 toHouse = (amount * distribution.houseReserveBps) / BPS_DENOMINATOR;
        uint256 toTreasury = (amount * distribution.treasuryBps) / BPS_DENOMINATOR;
        uint256 toBurn = (amount * distribution.burnBps) / BPS_DENOMINATOR;
        uint256 toJackpot = amount - toHouse - toTreasury - toBurn; // Remainder

        houseReserve += toHouse;
        jackpotPool += toJackpot;

        if (toTreasury > 0) {
            blueToken.transfer(treasuryWallet, toTreasury);
        }
        if (toBurn > 0) {
            blueToken.transfer(BURN_ADDRESS, toBurn);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Deposit BLUE to house reserve
     * @param amount Amount to deposit
     */
    function depositToReserve(uint256 amount) external onlyOwner {
        blueToken.transferFrom(msg.sender, address(this), amount);
        houseReserve += amount;
        emit ReserveDeposit(msg.sender, amount);
    }

    /**
     * @notice Withdraw BLUE from house reserve
     * @param amount Amount to withdraw
     */
    function withdrawFromReserve(uint256 amount) external onlyOwner {
        require(houseReserve >= amount, "Insufficient reserve");
        require(houseReserve - amount >= minReserve, "Would go below min reserve");

        houseReserve -= amount;
        blueToken.transfer(msg.sender, amount);
        emit ReserveWithdraw(msg.sender, amount);
    }

    /**
     * @notice Set bet limits
     * @param _minBet New minimum bet
     * @param _maxBet New maximum bet
     */
    function setBetLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        require(_minBet > 0, "Min bet must be > 0");
        require(_maxBet >= _minBet, "Max must be >= min");

        minBet = _minBet;
        maxBet = _maxBet;
        emit BetLimitsUpdated(_minBet, _maxBet);
    }

    /**
     * @notice Set minimum reserve requirement
     * @param _minReserve New minimum reserve
     */
    function setMinReserve(uint256 _minReserve) external onlyOwner {
        minReserve = _minReserve;
    }

    /**
     * @notice Set distribution percentages
     * @param _houseReserveBps House reserve basis points
     * @param _treasuryBps Treasury basis points
     * @param _burnBps Burn basis points
     * @param _jackpotPoolBps Jackpot pool basis points
     */
    function setDistribution(
        uint256 _houseReserveBps,
        uint256 _treasuryBps,
        uint256 _burnBps,
        uint256 _jackpotPoolBps
    ) external onlyOwner {
        if (_houseReserveBps + _treasuryBps + _burnBps + _jackpotPoolBps != BPS_DENOMINATOR) {
            revert InvalidDistribution();
        }

        distribution = Distribution({
            houseReserveBps: _houseReserveBps,
            treasuryBps: _treasuryBps,
            burnBps: _burnBps,
            jackpotPoolBps: _jackpotPoolBps
        });

        emit DistributionUpdated(_houseReserveBps, _treasuryBps, _burnBps, _jackpotPoolBps);
    }

    /**
     * @notice Set payout multipliers
     */
    function setPayoutMultipliers(
        uint256 _tripleBlue,
        uint256 _tripleDiamond,
        uint256 _tripleSeven,
        uint256 _tripleFire,
        uint256 _tripleLucky,
        uint256 _tripleStar,
        uint256 _twoMatch
    ) external onlyOwner {
        tripleBlueMultiplier = _tripleBlue;
        tripleDiamondMultiplier = _tripleDiamond;
        tripleSevenMultiplier = _tripleSeven;
        tripleFireMultiplier = _tripleFire;
        tripleLuckyMultiplier = _tripleLucky;
        tripleStarMultiplier = _tripleStar;
        twoMatchMultiplier = _twoMatch;
    }

    /**
     * @notice Set treasury wallet
     * @param _treasury New treasury address
     */
    function setTreasuryWallet(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasuryWallet = _treasury;
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw all funds (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = blueToken.balanceOf(address(this));
        houseReserve = 0;
        jackpotPool = 0;
        blueToken.transfer(msg.sender, balance);
    }
}
