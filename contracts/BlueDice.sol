// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlueDice
 * @notice Provably fair dice game using blockhash randomness for Blue Protocol
 * @dev Uses 2-step commit-reveal pattern: placeBet -> rollDice
 *
 * Bet Types:
 * - EXACT: Bet on exact number (1-6), pays 5.82x (house edge ~3%)
 * - OVER: Bet that roll will be > chosen number, variable payout
 * - UNDER: Bet that roll will be < chosen number, variable payout
 * - ODD: Bet on odd number (1,3,5), pays 1.94x
 * - EVEN: Bet on even number (2,4,6), pays 1.94x
 */
contract BlueDice is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    uint256 public constant BLOCKS_TO_WAIT = 2;
    uint256 public constant MAX_BLOCK_WAIT = 250;
    uint256 public constant BASIS_POINTS = 10000;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============ Enums ============

    enum BetType { EXACT, OVER, UNDER, ODD, EVEN }
    enum BetStatus { Pending, Won, Lost, Expired, Cancelled }

    // ============ Structs ============

    struct Bet {
        address player;
        uint256 amount;
        BetType betType;
        uint8 chosenNumber;      // For EXACT/OVER/UNDER bets (1-6)
        uint256 requestBlock;    // Block when bet was placed
        BetStatus status;
        uint8 rolledNumber;      // Result (1-6), 0 if not rolled yet
        uint256 payout;          // Amount won (0 if lost)
        uint256 timestamp;
    }

    // ============ State Variables ============

    IERC20 public immutable blueToken;
    address public treasuryWallet;

    // Bet tracking
    uint256 public currentBetId;
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public playerBets;

    // Betting limits
    uint256 public minBet = 5 ether;      // 5 BLUE minimum
    uint256 public maxBet = 500 ether;    // 500 BLUE maximum
    uint256 public maxPayout = 5000 ether; // Max payout per bet

    // House edge (in basis points)
    uint256 public houseEdge = 300; // 3%

    // Fee distribution (in basis points, must sum to houseEdge)
    uint256 public treasuryPercent = 200;  // 2% to treasury
    uint256 public burnPercent = 100;      // 1% burned

    // Payout multipliers (in basis points, before house edge)
    // EXACT: 6x base (1/6 chance) -> 5.82x after 3% edge = 58200
    // ODD/EVEN: 2x base (3/6 chance) -> 1.94x after 3% edge = 19400
    uint256 public exactMultiplier = 58200;
    uint256 public oddEvenMultiplier = 19400;

    // House bankroll for payouts
    uint256 public houseBankroll;

    // Statistics
    uint256 public totalBetsPlaced;
    uint256 public totalWagered;
    uint256 public totalPaidOut;

    // ============ Events ============

    event BetPlaced(
        uint256 indexed betId,
        address indexed player,
        uint256 amount,
        BetType betType,
        uint8 chosenNumber
    );

    event DiceRolled(
        uint256 indexed betId,
        address indexed player,
        uint8 rolledNumber,
        bool won,
        uint256 payout
    );

    event BetCancelled(uint256 indexed betId, address indexed player, uint256 refund);
    event BetExpired(uint256 indexed betId, address indexed player);
    event HouseFunded(address indexed funder, uint256 amount);
    event HouseWithdrawn(address indexed owner, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event LimitsUpdated(uint256 minBet, uint256 maxBet, uint256 maxPayout);
    event HouseEdgeUpdated(uint256 newEdge, uint256 treasuryPercent, uint256 burnPercent);

    // ============ Errors ============

    error InvalidBetAmount();
    error InvalidBetType();
    error InvalidChosenNumber();
    error BetNotFound();
    error BetAlreadyResolved();
    error TooEarlyToRoll();
    error BetExpiredError();
    error InsufficientHouseBankroll();
    error InvalidAddress();
    error InvalidPercentages();
    error NotBetOwner();
    error WithdrawExceedsBankroll();

    // ============ Constructor ============

    constructor(
        address _blueToken,
        address _treasuryWallet
    ) Ownable(msg.sender) {
        if (_blueToken == address(0) || _treasuryWallet == address(0)) {
            revert InvalidAddress();
        }
        blueToken = IERC20(_blueToken);
        treasuryWallet = _treasuryWallet;
    }

    // ============ External Functions ============

    /**
     * @notice Place a bet on the dice roll
     * @param amount Amount of BLUE tokens to bet
     * @param betType Type of bet (EXACT, OVER, UNDER, ODD, EVEN)
     * @param chosenNumber Number for EXACT/OVER/UNDER bets (1-6)
     */
    function placeBet(
        uint256 amount,
        BetType betType,
        uint8 chosenNumber
    ) external nonReentrant whenNotPaused returns (uint256 betId) {
        // Validate bet amount
        if (amount < minBet || amount > maxBet) {
            revert InvalidBetAmount();
        }

        // Validate chosen number based on bet type
        _validateBet(betType, chosenNumber);

        // Calculate potential payout and check house bankroll
        uint256 potentialPayout = calculatePayout(amount, betType, chosenNumber);
        if (potentialPayout > maxPayout) {
            revert InvalidBetAmount();
        }
        if (potentialPayout > houseBankroll) {
            revert InsufficientHouseBankroll();
        }

        // Transfer tokens from player
        blueToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create bet
        betId = currentBetId++;
        bets[betId] = Bet({
            player: msg.sender,
            amount: amount,
            betType: betType,
            chosenNumber: chosenNumber,
            requestBlock: block.number,
            status: BetStatus.Pending,
            rolledNumber: 0,
            payout: 0,
            timestamp: block.timestamp
        });

        playerBets[msg.sender].push(betId);
        totalBetsPlaced++;
        totalWagered += amount;

        emit BetPlaced(betId, msg.sender, amount, betType, chosenNumber);
    }

    /**
     * @notice Roll the dice for a pending bet
     * @param betId The bet ID to resolve
     */
    function rollDice(uint256 betId) external nonReentrant whenNotPaused {
        Bet storage bet = bets[betId];

        if (bet.player == address(0)) {
            revert BetNotFound();
        }
        if (bet.status != BetStatus.Pending) {
            revert BetAlreadyResolved();
        }

        // Check timing
        uint256 targetBlock = bet.requestBlock + BLOCKS_TO_WAIT;
        if (block.number < targetBlock) {
            revert TooEarlyToRoll();
        }
        if (block.number > bet.requestBlock + MAX_BLOCK_WAIT) {
            // Bet expired - refund player
            bet.status = BetStatus.Expired;
            blueToken.safeTransfer(bet.player, bet.amount);
            emit BetExpired(betId, bet.player);
            return;
        }

        // Generate random number using blockhash
        bytes32 blockHash = blockhash(targetBlock);
        if (blockHash == bytes32(0)) {
            // Blockhash not available (shouldn't happen within 256 blocks)
            revert BetExpiredError();
        }

        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            blockHash,
            bet.requestBlock,
            bet.player,
            bet.amount,
            betId
        )));

        // Roll dice (1-6)
        uint8 rolledNumber = uint8((randomSeed % 6) + 1);
        bet.rolledNumber = rolledNumber;

        // Determine if bet won
        bool won = _evaluateBet(bet.betType, bet.chosenNumber, rolledNumber);

        if (won) {
            uint256 payout = calculatePayout(bet.amount, bet.betType, bet.chosenNumber);
            bet.status = BetStatus.Won;
            bet.payout = payout;

            // Deduct from house bankroll and pay winner
            houseBankroll -= (payout - bet.amount);
            totalPaidOut += payout;

            // Distribute house edge
            _distributeHouseEdge(bet.amount);

            // Pay winner
            blueToken.safeTransfer(bet.player, payout);
        } else {
            bet.status = BetStatus.Lost;
            bet.payout = 0;

            // Add losing bet to house bankroll (minus house edge)
            uint256 houseEdgeAmount = (bet.amount * houseEdge) / BASIS_POINTS;
            houseBankroll += (bet.amount - houseEdgeAmount);

            // Distribute house edge
            _distributeHouseEdge(bet.amount);
        }

        emit DiceRolled(betId, bet.player, rolledNumber, won, bet.payout);
    }

    /**
     * @notice Cancel a pending bet (only if not yet rollable)
     * @param betId The bet ID to cancel
     */
    function cancelBet(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];

        if (bet.player != msg.sender) {
            revert NotBetOwner();
        }
        if (bet.status != BetStatus.Pending) {
            revert BetAlreadyResolved();
        }

        // Can only cancel if dice can't be rolled yet
        uint256 targetBlock = bet.requestBlock + BLOCKS_TO_WAIT;
        if (block.number >= targetBlock) {
            revert TooEarlyToRoll(); // Misleading name but means "too late to cancel"
        }

        bet.status = BetStatus.Cancelled;
        blueToken.safeTransfer(msg.sender, bet.amount);
        totalWagered -= bet.amount;
        totalBetsPlaced--;

        emit BetCancelled(betId, msg.sender, bet.amount);
    }

    /**
     * @notice Fund the house bankroll
     * @param amount Amount of BLUE tokens to add
     */
    function fundHouse(uint256 amount) external nonReentrant {
        blueToken.safeTransferFrom(msg.sender, address(this), amount);
        houseBankroll += amount;
        emit HouseFunded(msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate potential payout for a bet
     */
    function calculatePayout(
        uint256 amount,
        BetType betType,
        uint8 chosenNumber
    ) public view returns (uint256) {
        uint256 multiplier;

        if (betType == BetType.EXACT) {
            multiplier = exactMultiplier;
        } else if (betType == BetType.ODD || betType == BetType.EVEN) {
            multiplier = oddEvenMultiplier;
        } else if (betType == BetType.OVER) {
            // OVER X means roll must be > X
            // OVER 1: 5/6 chance -> 1.165x (11650)
            // OVER 2: 4/6 chance -> 1.455x (14550)
            // OVER 3: 3/6 chance -> 1.94x (19400)
            // OVER 4: 2/6 chance -> 2.91x (29100)
            // OVER 5: 1/6 chance -> 5.82x (58200)
            uint256 winningOutcomes = 6 - chosenNumber;
            multiplier = (BASIS_POINTS * 6 * (BASIS_POINTS - houseEdge)) / (winningOutcomes * BASIS_POINTS);
        } else if (betType == BetType.UNDER) {
            // UNDER X means roll must be < X
            // UNDER 2: 1/6 chance -> 5.82x (58200)
            // UNDER 3: 2/6 chance -> 2.91x (29100)
            // UNDER 4: 3/6 chance -> 1.94x (19400)
            // UNDER 5: 4/6 chance -> 1.455x (14550)
            // UNDER 6: 5/6 chance -> 1.165x (11650)
            uint256 winningOutcomes = chosenNumber - 1;
            multiplier = (BASIS_POINTS * 6 * (BASIS_POINTS - houseEdge)) / (winningOutcomes * BASIS_POINTS);
        }

        return (amount * multiplier) / BASIS_POINTS;
    }

    /**
     * @notice Get bet details
     */
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }

    /**
     * @notice Get player's bet history
     */
    function getPlayerBets(address player) external view returns (uint256[] memory) {
        return playerBets[player];
    }

    /**
     * @notice Get player's recent bets with details
     */
    function getPlayerRecentBets(
        address player,
        uint256 count
    ) external view returns (Bet[] memory) {
        uint256[] memory betIds = playerBets[player];
        uint256 length = betIds.length;
        uint256 resultCount = count < length ? count : length;

        Bet[] memory recentBets = new Bet[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            recentBets[i] = bets[betIds[length - 1 - i]];
        }
        return recentBets;
    }

    /**
     * @notice Check if a bet can be rolled
     */
    function canRoll(uint256 betId) external view returns (bool canExecute, string memory reason) {
        Bet storage bet = bets[betId];

        if (bet.player == address(0)) {
            return (false, "Bet not found");
        }
        if (bet.status != BetStatus.Pending) {
            return (false, "Bet already resolved");
        }

        uint256 targetBlock = bet.requestBlock + BLOCKS_TO_WAIT;
        if (block.number < targetBlock) {
            return (false, "Too early to roll");
        }
        if (block.number > bet.requestBlock + MAX_BLOCK_WAIT) {
            return (false, "Bet expired");
        }

        return (true, "Ready to roll");
    }

    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalBets,
        uint256 _totalWagered,
        uint256 _totalPaidOut,
        uint256 _houseBankroll,
        uint256 _houseProfit
    ) {
        _totalBets = totalBetsPlaced;
        _totalWagered = totalWagered;
        _totalPaidOut = totalPaidOut;
        _houseBankroll = houseBankroll;
        _houseProfit = totalWagered > totalPaidOut ? totalWagered - totalPaidOut : 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update treasury wallet
     */
    function setTreasuryWallet(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasuryWallet;
        treasuryWallet = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @notice Update betting limits
     */
    function setLimits(
        uint256 _minBet,
        uint256 _maxBet,
        uint256 _maxPayout
    ) external onlyOwner {
        minBet = _minBet;
        maxBet = _maxBet;
        maxPayout = _maxPayout;
        emit LimitsUpdated(_minBet, _maxBet, _maxPayout);
    }

    /**
     * @notice Update house edge and distribution
     */
    function setHouseEdge(
        uint256 _houseEdge,
        uint256 _treasuryPercent,
        uint256 _burnPercent
    ) external onlyOwner {
        if (_treasuryPercent + _burnPercent != _houseEdge) {
            revert InvalidPercentages();
        }
        if (_houseEdge > 1000) { // Max 10% house edge
            revert InvalidPercentages();
        }
        houseEdge = _houseEdge;
        treasuryPercent = _treasuryPercent;
        burnPercent = _burnPercent;

        // Update multipliers based on new house edge
        exactMultiplier = (BASIS_POINTS * 6 * (BASIS_POINTS - _houseEdge)) / BASIS_POINTS;
        oddEvenMultiplier = (BASIS_POINTS * 2 * (BASIS_POINTS - _houseEdge)) / BASIS_POINTS;

        emit HouseEdgeUpdated(_houseEdge, _treasuryPercent, _burnPercent);
    }

    /**
     * @notice Withdraw from house bankroll (owner only)
     */
    function withdrawHouse(uint256 amount) external onlyOwner nonReentrant {
        if (amount > houseBankroll) {
            revert WithdrawExceedsBankroll();
        }
        houseBankroll -= amount;
        blueToken.safeTransfer(treasuryWallet, amount);
        emit HouseWithdrawn(msg.sender, amount);
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
     * @notice Emergency refund for a stuck bet
     */
    function emergencyRefund(uint256 betId) external onlyOwner nonReentrant {
        Bet storage bet = bets[betId];
        if (bet.player == address(0)) revert BetNotFound();
        if (bet.status != BetStatus.Pending) revert BetAlreadyResolved();

        bet.status = BetStatus.Cancelled;
        blueToken.safeTransfer(bet.player, bet.amount);
        emit BetCancelled(betId, bet.player, bet.amount);
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate bet parameters
     */
    function _validateBet(BetType betType, uint8 chosenNumber) internal pure {
        if (betType == BetType.EXACT) {
            if (chosenNumber < 1 || chosenNumber > 6) {
                revert InvalidChosenNumber();
            }
        } else if (betType == BetType.OVER) {
            // Can bet OVER 1-5 (OVER 6 is impossible)
            if (chosenNumber < 1 || chosenNumber > 5) {
                revert InvalidChosenNumber();
            }
        } else if (betType == BetType.UNDER) {
            // Can bet UNDER 2-6 (UNDER 1 is impossible)
            if (chosenNumber < 2 || chosenNumber > 6) {
                revert InvalidChosenNumber();
            }
        } else if (betType == BetType.ODD || betType == BetType.EVEN) {
            // chosenNumber not used for ODD/EVEN
        }
    }

    /**
     * @notice Evaluate if a bet won
     */
    function _evaluateBet(
        BetType betType,
        uint8 chosenNumber,
        uint8 rolledNumber
    ) internal pure returns (bool) {
        if (betType == BetType.EXACT) {
            return rolledNumber == chosenNumber;
        } else if (betType == BetType.OVER) {
            return rolledNumber > chosenNumber;
        } else if (betType == BetType.UNDER) {
            return rolledNumber < chosenNumber;
        } else if (betType == BetType.ODD) {
            return rolledNumber % 2 == 1;
        } else if (betType == BetType.EVEN) {
            return rolledNumber % 2 == 0;
        }
        return false;
    }

    /**
     * @notice Distribute house edge to treasury and burn
     */
    function _distributeHouseEdge(uint256 betAmount) internal {
        uint256 toTreasury = (betAmount * treasuryPercent) / BASIS_POINTS;
        uint256 toBurn = (betAmount * burnPercent) / BASIS_POINTS;

        if (toTreasury > 0) {
            blueToken.safeTransfer(treasuryWallet, toTreasury);
        }
        if (toBurn > 0) {
            blueToken.safeTransfer(BURN_ADDRESS, toBurn);
        }
    }
}
