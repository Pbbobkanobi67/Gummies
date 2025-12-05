// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlueRaffleBlockhash
 * @notice Provably fair raffle using blockhash randomness
 * @dev Modular design for reusability across different game types
 */
contract BlueRaffleBlockhash is Ownable, ReentrancyGuard, Pausable {

    // ============ State Variables ============

    IERC20 public immutable blueToken;

    address public treasuryWallet;
    address public developerWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint256 public currentRoundId;
    uint256 public roundDuration = 5 minutes;

    // Distribution percentages (out of 10000 for precision)
    uint16 public prizePercent = 9400;      // 94%
    uint16 public developerPercent = 200;   // 2%
    uint16 public burnPercent = 200;        // 2%
    uint16 public seedPercent = 100;        // 1%
    uint16 public buybackPercent = 100;     // 1%

    // Entry limits
    uint256 public minTickets = 5e18;       // 5 BLUE
    uint256 public maxTickets = 150e18;     // 150 BLUE
    uint256 public minParticipants = 2;     // Minimum to draw

    // Bonus round multiplier (1 BLUE = ticketMultiplier tickets)
    uint256 public ticketMultiplier = 1;    // Default: 1:1 ratio

    uint256 public seedPool;                // Accumulated seed for next round

    // Blockhash configuration
    uint256 public constant BLOCKS_TO_WAIT = 2;  // Wait 2 blocks after request
    uint256 public constant MAX_BLOCK_WAIT = 250; // Must execute within 250 blocks

    enum RoundStatus { Waiting, Active, Drawing, Complete, Cancelled }

    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 totalTickets;
        uint256 uniqueWallets;
        address winner;
        uint256 winnerPrize;
        RoundStatus status;
        uint256 drawRequestBlock;  // Block number when draw was requested
        uint256 randomSeed;        // Final random number used
    }

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => address[]) public roundParticipants;
    mapping(uint256 => mapping(address => uint256)) public userTickets;

    // ============ Events ============

    event RoundStarted(uint256 indexed roundId, uint256 timestamp);
    event RoundActivated(uint256 indexed roundId, uint256 endTime, uint256 participants);
    event TicketsPurchased(address indexed user, uint256 ticketsAmount, uint256 blueAmount, uint256 roundId);
    event DrawRequested(uint256 indexed roundId, uint256 requestBlock, uint256 targetBlock);
    event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 prize, uint256 randomSeed);
    event RoundRefunded(uint256 indexed roundId, address indexed player, uint256 amount);
    event BonusRoundActivated(uint256 multiplier);
    event ConfigUpdated(string param, uint256 value);

    // ============ Errors ============

    error InvalidAmount();
    error RoundNotActive();
    error RoundNotWaiting();
    error RoundNotDrawing();
    error TooEarly();
    error NotEnoughParticipants();
    error ExceedsMaxTickets();
    error BelowMinTickets();
    error DrawNotReady();
    error DrawExpired();
    error InvalidDistribution();
    error InvalidAddress();
    error NoTicketsToWithdraw();
    error RoundNotWaitingOrActive();

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

        _startNewRound();
    }

    // ============ Player Functions ============

    /**
     * @notice Buy raffle tickets
     * @param blueAmount Amount of BLUE tokens to spend
     */
    function buyTickets(uint256 blueAmount) external nonReentrant whenNotPaused {
        Round storage round = rounds[currentRoundId];

        if (round.status != RoundStatus.Waiting && round.status != RoundStatus.Active) {
            revert RoundNotActive();
        }

        // If Active, check timer hasn't expired
        if (round.status == RoundStatus.Active && block.timestamp >= round.endTime) {
            revert TooEarly();
        }

        // Calculate tickets based on multiplier
        uint256 ticketsAmount = blueAmount * ticketMultiplier;

        // Check entry limits
        if (ticketsAmount < minTickets) revert BelowMinTickets();

        uint256 userTotal = userTickets[currentRoundId][msg.sender] + ticketsAmount;
        if (userTotal > maxTickets) revert ExceedsMaxTickets();

        // Transfer BLUE tokens
        require(blueToken.transferFrom(msg.sender, address(this), blueAmount), "Transfer failed");

        // Calculate distributions
        uint256 toPrize = (blueAmount * prizePercent) / 10000;
        uint256 toDev = (blueAmount * developerPercent) / 10000;
        uint256 toBurn = (blueAmount * burnPercent) / 10000;
        uint256 toSeed = (blueAmount * seedPercent) / 10000;
        uint256 toBuyback = (blueAmount * buybackPercent) / 10000;

        // Update round state
        round.prizePool += toPrize;
        round.totalTickets += ticketsAmount;

        // Track new participant
        if (userTickets[currentRoundId][msg.sender] == 0) {
            roundParticipants[currentRoundId].push(msg.sender);
            round.uniqueWallets++;
        }
        userTickets[currentRoundId][msg.sender] += ticketsAmount;

        // Distribute funds
        blueToken.transfer(developerWallet, toDev);
        blueToken.transfer(BURN_ADDRESS, toBurn);
        seedPool += toSeed;
        blueToken.transfer(treasuryWallet, toBuyback);

        // Activate round when 2nd player joins
        if (round.status == RoundStatus.Waiting && round.uniqueWallets >= minParticipants) {
            round.status = RoundStatus.Active;
            round.startTime = block.timestamp;
            round.endTime = block.timestamp + roundDuration;
            emit RoundActivated(currentRoundId, round.endTime, round.uniqueWallets);
        }

        emit TicketsPurchased(msg.sender, ticketsAmount, blueAmount, currentRoundId);
    }

    /**
     * @notice Withdraw from a round that is stuck in Waiting status
     * @dev Allows single players to recover their funds without owner intervention
     * @dev Refunds proportional share from prize pool (94% of original deposit)
     */
    function withdrawFromWaiting() external nonReentrant {
        Round storage round = rounds[currentRoundId];

        // Can only withdraw if round is in Waiting status (not yet activated)
        if (round.status != RoundStatus.Waiting) revert RoundNotWaiting();

        uint256 tickets = userTickets[currentRoundId][msg.sender];
        if (tickets == 0) revert NoTicketsToWithdraw();

        // Calculate proportional refund from prize pool
        // (user's tickets / total tickets) * prize pool
        uint256 refundAmount = (tickets * round.prizePool) / round.totalTickets;

        // Clear user's tickets
        userTickets[currentRoundId][msg.sender] = 0;
        round.totalTickets -= tickets;
        round.prizePool -= refundAmount;
        round.uniqueWallets--;

        // Transfer refund
        if (refundAmount > 0) {
            blueToken.transfer(msg.sender, refundAmount);
            emit RoundRefunded(currentRoundId, msg.sender, refundAmount);
        }

        // If no participants left, start a new round
        if (round.uniqueWallets == 0) {
            round.status = RoundStatus.Cancelled;
            _startNewRound();
        }
    }

    /**
     * @notice Request draw (step 1 of 2-step process)
     * @dev Stores block number for future blockhash lookup
     */
    function requestDraw() external nonReentrant {
        Round storage round = rounds[currentRoundId];

        if (round.status != RoundStatus.Active) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert TooEarly();
        if (round.uniqueWallets < minParticipants) revert NotEnoughParticipants();

        // Handle single player edge case
        if (round.uniqueWallets == 1) {
            _refundSinglePlayer(currentRoundId);
            return;
        }

        round.status = RoundStatus.Drawing;
        round.drawRequestBlock = block.number;

        uint256 targetBlock = block.number + BLOCKS_TO_WAIT;
        emit DrawRequested(currentRoundId, block.number, targetBlock);
    }

    /**
     * @notice Execute draw (step 2 of 2-step process)
     * @dev Uses blockhash for randomness and selects winner
     */
    function executeDraw() external nonReentrant {
        Round storage round = rounds[currentRoundId];

        if (round.status != RoundStatus.Drawing) revert RoundNotDrawing();

        uint256 targetBlock = round.drawRequestBlock + BLOCKS_TO_WAIT;

        // Check if enough blocks have passed
        if (block.number <= targetBlock) revert DrawNotReady();

        // Check if blockhash is still available (within 256 blocks)
        if (block.number > targetBlock + MAX_BLOCK_WAIT) revert DrawExpired();

        // Get blockhash for randomness
        bytes32 blockHash = blockhash(targetBlock);
        require(blockHash != bytes32(0), "Blockhash unavailable");

        // Generate random seed
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            blockHash,
            round.drawRequestBlock,
            round.totalTickets,
            round.uniqueWallets
        )));

        round.randomSeed = randomSeed;

        // Select winner using weighted random selection
        address winner = _selectWinner(currentRoundId, randomSeed);

        round.winner = winner;
        round.status = RoundStatus.Complete;
        round.winnerPrize = round.prizePool;

        // Transfer prize to winner
        if (round.prizePool > 0) {
            blueToken.transfer(winner, round.prizePool);
        }

        emit WinnerSelected(currentRoundId, winner, round.prizePool, randomSeed);

        // Start new round
        _startNewRound();
    }

    // ============ Admin Functions ============

    /**
     * @notice Set bonus round multiplier
     * @param multiplier Tickets per BLUE (e.g., 2 = double tickets)
     */
    function setBonusMultiplier(uint256 multiplier) external onlyOwner {
        require(multiplier >= 1 && multiplier <= 10, "Invalid multiplier");
        ticketMultiplier = multiplier;
        emit BonusRoundActivated(multiplier);
    }

    /**
     * @notice Update entry limits
     */
    function setEntryLimits(uint256 _min, uint256 _max, uint256 _minParticipants) external onlyOwner {
        require(_min > 0 && _max > _min, "Invalid limits");
        minTickets = _min;
        maxTickets = _max;
        minParticipants = _minParticipants;
        emit ConfigUpdated("entryLimits", _min);
    }

    /**
     * @notice Update prize distribution percentages
     */
    function setDistribution(
        uint16 _prize,
        uint16 _dev,
        uint16 _burn,
        uint16 _seed,
        uint16 _buyback
    ) external onlyOwner {
        if (_prize + _dev + _burn + _seed + _buyback != 10000) revert InvalidDistribution();

        prizePercent = _prize;
        developerPercent = _dev;
        burnPercent = _burn;
        seedPercent = _seed;
        buybackPercent = _buyback;

        emit ConfigUpdated("distribution", _prize);
    }

    /**
     * @notice Set round duration
     */
    function setRoundDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 minutes && _duration <= 7 days, "Invalid duration");
        roundDuration = _duration;
        emit ConfigUpdated("roundDuration", _duration);
    }

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
     * @notice Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Cancel current round and refund all participants (emergency)
     * @dev Refunds proportional share of prize pool to each participant
     * @dev Note: Refund is ~94% of original deposit since 6% was already distributed
     */
    function cancelRound() external onlyOwner {
        Round storage round = rounds[currentRoundId];
        require(round.status != RoundStatus.Complete, "Round already complete");

        address[] memory participants = roundParticipants[currentRoundId];
        uint256 totalTicketsSnapshot = round.totalTickets;
        uint256 prizePoolSnapshot = round.prizePool;

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 tickets = userTickets[currentRoundId][participant];

            if (tickets > 0 && totalTicketsSnapshot > 0) {
                // Calculate proportional refund from prize pool
                // (user's tickets / total tickets) * prize pool
                uint256 refundAmount = (tickets * prizePoolSnapshot) / totalTicketsSnapshot;

                // Refund from prize pool
                if (refundAmount > 0 && refundAmount <= blueToken.balanceOf(address(this))) {
                    blueToken.transfer(participant, refundAmount);
                    emit RoundRefunded(currentRoundId, participant, refundAmount);
                }
            }
        }

        round.status = RoundStatus.Cancelled;
        _startNewRound();
    }

    // ============ View Functions ============

    /**
     * @notice Get current round information
     */
    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 prizePool,
        uint256 totalTickets,
        uint256 uniqueWallets,
        RoundStatus status,
        uint256 timeRemaining
    ) {
        Round memory round = rounds[currentRoundId];

        uint256 remaining = 0;
        if (round.status == RoundStatus.Active && block.timestamp < round.endTime) {
            remaining = round.endTime - block.timestamp;
        }

        return (
            round.roundId,
            round.startTime,
            round.endTime,
            round.prizePool,
            round.totalTickets,
            round.uniqueWallets,
            round.status,
            remaining
        );
    }

    /**
     * @notice Get round details by ID
     */
    function getRoundDetails(uint256 roundId) external view returns (
        address winner,
        uint256 winnerPrize,
        uint256 prizePool,
        uint256 totalTickets,
        RoundStatus status,
        uint256 randomSeed
    ) {
        Round memory round = rounds[roundId];
        return (
            round.winner,
            round.winnerPrize,
            round.prizePool,
            round.totalTickets,
            round.status,
            round.randomSeed
        );
    }

    /**
     * @notice Get user tickets in a round
     */
    function getUserTickets(uint256 roundId, address user) external view returns (uint256) {
        return userTickets[roundId][user];
    }

    /**
     * @notice Get all participants in a round
     */
    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return roundParticipants[roundId];
    }

    /**
     * @notice Check if draw can be requested
     */
    function canRequestDraw() external view returns (bool canRequest, string memory reason) {
        Round memory round = rounds[currentRoundId];

        if (round.status != RoundStatus.Active) {
            return (false, "Round not active");
        }
        if (block.timestamp < round.endTime) {
            return (false, "Round still running");
        }
        if (round.uniqueWallets < minParticipants) {
            return (false, "Not enough participants");
        }

        return (true, "Ready to draw");
    }

    /**
     * @notice Check if draw can be executed
     */
    function canExecuteDraw() external view returns (bool canExecute, string memory reason) {
        Round memory round = rounds[currentRoundId];

        if (round.status != RoundStatus.Drawing) {
            return (false, "Draw not requested");
        }

        uint256 targetBlock = round.drawRequestBlock + BLOCKS_TO_WAIT;

        if (block.number <= targetBlock) {
            uint256 blocksLeft = targetBlock - block.number + 1;
            return (false, string(abi.encodePacked("Wait ", blocksLeft, " more blocks")));
        }

        if (block.number > targetBlock + MAX_BLOCK_WAIT) {
            return (false, "Draw expired - request again");
        }

        return (true, "Ready to execute");
    }

    // ============ Internal Functions ============

    /**
     * @notice Start a new round
     */
    function _startNewRound() internal {
        currentRoundId++;

        uint256 seedAmount = seedPool;
        if (seedAmount > 0) {
            seedPool = 0;
        }

        rounds[currentRoundId] = Round({
            roundId: currentRoundId,
            startTime: 0,
            endTime: 0,
            prizePool: seedAmount,
            totalTickets: 0,
            uniqueWallets: 0,
            winner: address(0),
            winnerPrize: 0,
            status: RoundStatus.Waiting,
            drawRequestBlock: 0,
            randomSeed: 0
        });

        emit RoundStarted(currentRoundId, block.timestamp);
    }

    /**
     * @notice Select winner using weighted random selection
     */
    function _selectWinner(uint256 roundId, uint256 randomSeed) internal view returns (address) {
        address[] memory participants = roundParticipants[roundId];
        uint256 totalTickets = rounds[roundId].totalTickets;

        uint256 winningTicket = randomSeed % totalTickets;
        uint256 cumulativeTickets = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            cumulativeTickets += userTickets[roundId][participants[i]];
            if (winningTicket < cumulativeTickets) {
                return participants[i];
            }
        }

        // Fallback (should never reach here)
        return participants[participants.length - 1];
    }

    /**
     * @notice Refund single player and start new round
     * @dev Refunds the entire prize pool to the single player (94% of deposit)
     */
    function _refundSinglePlayer(uint256 roundId) internal {
        Round storage round = rounds[roundId];
        address[] memory participants = roundParticipants[roundId];

        if (participants.length == 1) {
            address player = participants[0];
            uint256 refundAmount = round.prizePool; // Refund entire prize pool

            // Refund from contract balance
            if (refundAmount > 0) {
                blueToken.transfer(player, refundAmount);
                emit RoundRefunded(roundId, player, refundAmount);
            }
        }

        round.status = RoundStatus.Cancelled;
        _startNewRound();
    }
}
