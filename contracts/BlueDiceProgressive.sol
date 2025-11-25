// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlueDiceProgressive
 * @notice Progressive jackpot dice game for Blue Protocol
 * @dev Uses blockhash randomness with 2-step commit-reveal pattern
 *
 * Game Rules:
 * - 4 target dice are set at the start of each round
 * - Players pay 1 BLUE per roll to try matching all 4 dice
 * - Match 4/4: Win 80% of jackpot
 * - Match 3/4: Win 1% of jackpot (min 5 BLUE)
 * - Match 2/4: Win 1 BLUE refund
 * - On jackpot win: 10% seeds next pot, 3% treasury, 2% dev, 3% burned
 */
contract BlueDiceProgressive is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    uint256 public constant BLOCKS_TO_WAIT = 2;
    uint256 public constant MAX_BLOCK_WAIT = 250;
    uint256 public constant BASIS_POINTS = 10000;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Payout percentages (in basis points)
    uint256 public constant JACKPOT_PERCENT = 8000;      // 80%
    uint256 public constant MATCH_3_PERCENT = 100;       // 1%
    uint256 public constant SEED_PERCENT = 1000;         // 10%
    uint256 public constant TREASURY_PERCENT = 300;      // 3%
    uint256 public constant DEV_PERCENT = 200;           // 2%
    uint256 public constant BURN_PERCENT = 300;          // 3%

    uint256 public constant MATCH_3_MIN = 5 ether;       // Min 5 BLUE for 3/4 match
    uint256 public constant MATCH_2_REFUND = 1 ether;    // 1 BLUE refund for 2/4

    // ============ Enums ============

    enum RollStatus { Pending, Completed, Expired, Cancelled }

    // ============ Structs ============

    struct TargetDice {
        uint8 die1;
        uint8 die2;
        uint8 die3;
        uint8 die4;
        uint256 setAtBlock;
        uint256 roundId;
    }

    struct Roll {
        address player;
        uint256 requestBlock;
        RollStatus status;
        uint8[4] rolledDice;
        uint8 matches;
        uint256 payout;
        uint256 timestamp;
    }

    // ============ State Variables ============

    IERC20 public immutable blueToken;
    address public treasuryWallet;
    address public developerWallet;

    // Current target dice
    TargetDice public targetDice;

    // Jackpot pool
    uint256 public jackpotPool;
    uint256 public currentRoundId;

    // Roll tracking
    uint256 public currentRollId;
    mapping(uint256 => Roll) public rolls;
    mapping(address => uint256[]) public playerRolls;

    // Ticket price
    uint256 public ticketPrice = 1 ether; // 1 BLUE

    // Statistics
    uint256 public totalRolls;
    uint256 public totalJackpotsWon;
    uint256 public totalPaidOut;

    // ============ Events ============

    event TargetDiceSet(
        uint256 indexed roundId,
        uint8 die1,
        uint8 die2,
        uint8 die3,
        uint8 die4
    );

    event RollRequested(
        uint256 indexed rollId,
        address indexed player,
        uint256 roundId
    );

    event RollCompleted(
        uint256 indexed rollId,
        address indexed player,
        uint8[4] rolledDice,
        uint8 matches,
        uint256 payout,
        bool isJackpot
    );

    event JackpotWon(
        uint256 indexed roundId,
        address indexed winner,
        uint256 amount,
        uint8[4] winningDice
    );

    event JackpotFunded(address indexed funder, uint256 amount);
    event RollCancelled(uint256 indexed rollId, address indexed player);
    event RollExpired(uint256 indexed rollId, address indexed player);

    // ============ Errors ============

    error InvalidAddress();
    error RollNotFound();
    error RollAlreadyCompleted();
    error TooEarlyToReveal();
    error RollExpiredError();
    error NotRollOwner();
    error TargetNotSet();
    error InsufficientJackpot();

    // ============ Constructor ============

    constructor(
        address _blueToken,
        address _treasuryWallet,
        address _developerWallet
    ) Ownable(msg.sender) {
        if (_blueToken == address(0) || _treasuryWallet == address(0) || _developerWallet == address(0)) {
            revert InvalidAddress();
        }
        blueToken = IERC20(_blueToken);
        treasuryWallet = _treasuryWallet;
        developerWallet = _developerWallet;
    }

    // ============ External Functions ============

    /**
     * @notice Set new target dice (starts new round)
     * @dev Anyone can call this when no target is set or after jackpot
     */
    function setTargetDice() external nonReentrant whenNotPaused {
        // Can only set if no target exists or previous round ended
        require(
            targetDice.setAtBlock == 0 ||
            block.number > targetDice.setAtBlock + BLOCKS_TO_WAIT,
            "Target already pending"
        );

        // If this is a fresh set (not reveal), store block
        if (targetDice.setAtBlock == 0 || _isTargetRevealed()) {
            targetDice.setAtBlock = block.number;
            targetDice.roundId = ++currentRoundId;
        }
    }

    /**
     * @notice Reveal the target dice using blockhash
     */
    function revealTargetDice() external nonReentrant whenNotPaused {
        require(targetDice.setAtBlock > 0, "No target pending");
        require(block.number >= targetDice.setAtBlock + BLOCKS_TO_WAIT, "Too early");
        require(block.number <= targetDice.setAtBlock + MAX_BLOCK_WAIT, "Target expired, set again");
        require(!_isTargetRevealed(), "Target already revealed");

        bytes32 blockHash = blockhash(targetDice.setAtBlock + BLOCKS_TO_WAIT);
        require(blockHash != bytes32(0), "Blockhash unavailable");

        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            blockHash,
            targetDice.setAtBlock,
            targetDice.roundId
        )));

        targetDice.die1 = uint8((randomSeed % 6) + 1);
        targetDice.die2 = uint8(((randomSeed >> 8) % 6) + 1);
        targetDice.die3 = uint8(((randomSeed >> 16) % 6) + 1);
        targetDice.die4 = uint8(((randomSeed >> 24) % 6) + 1);

        emit TargetDiceSet(
            targetDice.roundId,
            targetDice.die1,
            targetDice.die2,
            targetDice.die3,
            targetDice.die4
        );
    }

    /**
     * @notice Purchase a roll (step 1 of commit-reveal)
     */
    function buyRoll() external nonReentrant whenNotPaused returns (uint256 rollId) {
        require(_isTargetRevealed(), "Target dice not set");

        // Check jackpot can cover minimum 3/4 payout
        require(jackpotPool >= MATCH_3_MIN, "Jackpot too low");

        // Transfer ticket price from player
        blueToken.safeTransferFrom(msg.sender, address(this), ticketPrice);

        // Add to jackpot pool
        jackpotPool += ticketPrice;

        // Create roll
        rollId = currentRollId++;
        rolls[rollId] = Roll({
            player: msg.sender,
            requestBlock: block.number,
            status: RollStatus.Pending,
            rolledDice: [uint8(0), uint8(0), uint8(0), uint8(0)],
            matches: 0,
            payout: 0,
            timestamp: block.timestamp
        });

        playerRolls[msg.sender].push(rollId);
        totalRolls++;

        emit RollRequested(rollId, msg.sender, targetDice.roundId);
    }

    /**
     * @notice Reveal roll result (step 2 of commit-reveal)
     * @param rollId The roll to reveal
     */
    function revealRoll(uint256 rollId) external nonReentrant whenNotPaused {
        Roll storage roll = rolls[rollId];

        if (roll.player == address(0)) revert RollNotFound();
        if (roll.status != RollStatus.Pending) revert RollAlreadyCompleted();

        uint256 targetBlock = roll.requestBlock + BLOCKS_TO_WAIT;

        if (block.number < targetBlock) revert TooEarlyToReveal();

        if (block.number > roll.requestBlock + MAX_BLOCK_WAIT) {
            // Roll expired - refund player
            roll.status = RollStatus.Expired;
            jackpotPool -= ticketPrice;
            blueToken.safeTransfer(roll.player, ticketPrice);
            emit RollExpired(rollId, roll.player);
            return;
        }

        bytes32 blockHash = blockhash(targetBlock);
        if (blockHash == bytes32(0)) revert RollExpiredError();

        // Generate random dice
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            blockHash,
            roll.requestBlock,
            roll.player,
            rollId
        )));

        roll.rolledDice[0] = uint8((randomSeed % 6) + 1);
        roll.rolledDice[1] = uint8(((randomSeed >> 8) % 6) + 1);
        roll.rolledDice[2] = uint8(((randomSeed >> 16) % 6) + 1);
        roll.rolledDice[3] = uint8(((randomSeed >> 24) % 6) + 1);

        // Count matches
        roll.matches = _countMatches(roll.rolledDice);
        roll.status = RollStatus.Completed;

        // Process payout based on matches
        bool isJackpot = false;

        if (roll.matches == 4) {
            // JACKPOT!
            isJackpot = true;
            _processJackpot(roll.player, roll.rolledDice);
            roll.payout = (jackpotPool * JACKPOT_PERCENT) / BASIS_POINTS;
        } else if (roll.matches == 3) {
            // 3/4 match - 1% of pot (min 5 BLUE)
            uint256 payout = (jackpotPool * MATCH_3_PERCENT) / BASIS_POINTS;
            if (payout < MATCH_3_MIN) payout = MATCH_3_MIN;

            // Ensure we have enough in pool
            if (payout > jackpotPool) payout = jackpotPool;

            roll.payout = payout;
            jackpotPool -= payout;
            totalPaidOut += payout;
            blueToken.safeTransfer(roll.player, payout);
        } else if (roll.matches == 2) {
            // 2/4 match - 1 BLUE refund
            roll.payout = MATCH_2_REFUND;
            jackpotPool -= MATCH_2_REFUND;
            totalPaidOut += MATCH_2_REFUND;
            blueToken.safeTransfer(roll.player, MATCH_2_REFUND);
        }
        // 0-1 matches = no payout, BLUE stays in pool

        emit RollCompleted(
            rollId,
            roll.player,
            roll.rolledDice,
            roll.matches,
            roll.payout,
            isJackpot
        );
    }

    /**
     * @notice Fund the jackpot pool
     * @param amount Amount of BLUE to add
     */
    function fundJackpot(uint256 amount) external nonReentrant {
        blueToken.safeTransferFrom(msg.sender, address(this), amount);
        jackpotPool += amount;
        emit JackpotFunded(msg.sender, amount);
    }

    /**
     * @notice Cancel a pending roll (only before reveal is possible)
     * @param rollId The roll to cancel
     */
    function cancelRoll(uint256 rollId) external nonReentrant {
        Roll storage roll = rolls[rollId];

        if (roll.player != msg.sender) revert NotRollOwner();
        if (roll.status != RollStatus.Pending) revert RollAlreadyCompleted();

        uint256 targetBlock = roll.requestBlock + BLOCKS_TO_WAIT;
        require(block.number < targetBlock, "Too late to cancel");

        roll.status = RollStatus.Cancelled;
        jackpotPool -= ticketPrice;
        blueToken.safeTransfer(msg.sender, ticketPrice);

        emit RollCancelled(rollId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Get current target dice
     */
    function getTargetDice() external view returns (
        uint8 die1,
        uint8 die2,
        uint8 die3,
        uint8 die4,
        uint256 roundId,
        bool isRevealed
    ) {
        return (
            targetDice.die1,
            targetDice.die2,
            targetDice.die3,
            targetDice.die4,
            targetDice.roundId,
            _isTargetRevealed()
        );
    }

    /**
     * @notice Get roll details
     */
    function getRoll(uint256 rollId) external view returns (Roll memory) {
        return rolls[rollId];
    }

    /**
     * @notice Get player's roll history
     */
    function getPlayerRolls(address player) external view returns (uint256[] memory) {
        return playerRolls[player];
    }

    /**
     * @notice Get player's recent rolls with details
     */
    function getPlayerRecentRolls(address player, uint256 count) external view returns (Roll[] memory) {
        uint256[] memory rollIds = playerRolls[player];
        uint256 length = rollIds.length;
        uint256 resultCount = count < length ? count : length;

        Roll[] memory recentRolls = new Roll[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            recentRolls[i] = rolls[rollIds[length - 1 - i]];
        }
        return recentRolls;
    }

    /**
     * @notice Check if a roll can be revealed
     */
    function canRevealRoll(uint256 rollId) external view returns (bool canReveal, string memory reason) {
        Roll storage roll = rolls[rollId];

        if (roll.player == address(0)) return (false, "Roll not found");
        if (roll.status != RollStatus.Pending) return (false, "Roll already completed");

        uint256 targetBlock = roll.requestBlock + BLOCKS_TO_WAIT;
        if (block.number < targetBlock) return (false, "Too early to reveal");
        if (block.number > roll.requestBlock + MAX_BLOCK_WAIT) return (false, "Roll expired");

        return (true, "Ready to reveal");
    }

    /**
     * @notice Get game statistics
     */
    function getStats() external view returns (
        uint256 _jackpotPool,
        uint256 _currentRoundId,
        uint256 _totalRolls,
        uint256 _totalJackpotsWon,
        uint256 _totalPaidOut,
        uint256 _ticketPrice
    ) {
        return (
            jackpotPool,
            currentRoundId,
            totalRolls,
            totalJackpotsWon,
            totalPaidOut,
            ticketPrice
        );
    }

    /**
     * @notice Calculate potential payouts for current jackpot
     */
    function getPotentialPayouts() external view returns (
        uint256 jackpotPayout,
        uint256 match3Payout,
        uint256 match2Payout
    ) {
        jackpotPayout = (jackpotPool * JACKPOT_PERCENT) / BASIS_POINTS;
        match3Payout = (jackpotPool * MATCH_3_PERCENT) / BASIS_POINTS;
        if (match3Payout < MATCH_3_MIN) match3Payout = MATCH_3_MIN;
        match2Payout = MATCH_2_REFUND;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update treasury wallet
     */
    function setTreasuryWallet(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        treasuryWallet = _treasury;
    }

    /**
     * @notice Update developer wallet
     */
    function setDeveloperWallet(address _developer) external onlyOwner {
        if (_developer == address(0)) revert InvalidAddress();
        developerWallet = _developer;
    }

    /**
     * @notice Update ticket price
     */
    function setTicketPrice(uint256 _price) external onlyOwner {
        ticketPrice = _price;
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
     * @notice Emergency refund for stuck roll
     */
    function emergencyRefund(uint256 rollId) external onlyOwner nonReentrant {
        Roll storage roll = rolls[rollId];
        if (roll.player == address(0)) revert RollNotFound();
        if (roll.status != RollStatus.Pending) revert RollAlreadyCompleted();

        roll.status = RollStatus.Cancelled;
        jackpotPool -= ticketPrice;
        blueToken.safeTransfer(roll.player, ticketPrice);
        emit RollCancelled(rollId, roll.player);
    }

    // ============ Internal Functions ============

    /**
     * @notice Check if target dice have been revealed
     */
    function _isTargetRevealed() internal view returns (bool) {
        return targetDice.die1 > 0 && targetDice.die2 > 0 &&
               targetDice.die3 > 0 && targetDice.die4 > 0;
    }

    /**
     * @notice Count how many dice match the target (order independent)
     */
    function _countMatches(uint8[4] memory rolled) internal view returns (uint8) {
        // Create arrays to track which dice have been matched
        bool[4] memory targetMatched = [false, false, false, false];
        bool[4] memory rolledMatched = [false, false, false, false];

        uint8[4] memory target = [targetDice.die1, targetDice.die2, targetDice.die3, targetDice.die4];

        uint8 matches = 0;

        // For each rolled die, try to find an unmatched target die with same value
        for (uint8 i = 0; i < 4; i++) {
            for (uint8 j = 0; j < 4; j++) {
                if (!rolledMatched[i] && !targetMatched[j] && rolled[i] == target[j]) {
                    rolledMatched[i] = true;
                    targetMatched[j] = true;
                    matches++;
                    break;
                }
            }
        }

        return matches;
    }

    /**
     * @notice Process jackpot win
     */
    function _processJackpot(address winner, uint8[4] memory winningDice) internal {
        uint256 pool = jackpotPool;

        // Calculate distributions
        uint256 winnerPayout = (pool * JACKPOT_PERCENT) / BASIS_POINTS;
        uint256 seedNext = (pool * SEED_PERCENT) / BASIS_POINTS;
        uint256 toTreasury = (pool * TREASURY_PERCENT) / BASIS_POINTS;
        uint256 toDev = (pool * DEV_PERCENT) / BASIS_POINTS;
        uint256 toBurn = (pool * BURN_PERCENT) / BASIS_POINTS;

        // Reset jackpot to seed amount
        jackpotPool = seedNext;

        // Reset target dice for new round
        targetDice.die1 = 0;
        targetDice.die2 = 0;
        targetDice.die3 = 0;
        targetDice.die4 = 0;
        targetDice.setAtBlock = 0;

        // Transfer payouts
        totalPaidOut += winnerPayout;
        totalJackpotsWon++;

        blueToken.safeTransfer(winner, winnerPayout);
        blueToken.safeTransfer(treasuryWallet, toTreasury);
        blueToken.safeTransfer(developerWallet, toDev);
        blueToken.safeTransfer(BURN_ADDRESS, toBurn);

        emit JackpotWon(targetDice.roundId, winner, winnerPayout, winningDice);
    }
}
