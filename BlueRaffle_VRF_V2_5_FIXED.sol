// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// CORRECT VRF v2.5 IMPORTS
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

/**
 * @title BlueRaffle - FIXED for VRF v2.5
 * @notice Casino-style raffle for BlueBNB DeFi protocol
 * @dev CORRECTED to use VRF v2.5 with struct-based requestRandomWords
 */
contract BlueRaffle is VRFConsumerBaseV2Plus, Ownable, ReentrancyGuard {
    IERC20 public blueToken;
    IVRFCoordinatorV2Plus private s_vrfCoordinator;

    // VRF Configuration
    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;

    // Wallets
    address public treasuryWallet;
    address public developerWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Raffle state
    uint256 public currentRoundId;
    uint256 public roundDuration = 5 minutes;

    // Distribution percentages (out of 100)
    uint8 public prizePercent = 94;
    uint8 public developerPercent = 2;
    uint8 public burnPercent = 2;
    uint8 public seedPercent = 1;
    uint8 public buybackPercent = 1;

    // Entry limits
    uint256 public minTickets = 5e18;  // 5 BLUE minimum
    uint256 public maxTickets = 150e18; // 150 BLUE maximum per wallet
    uint256 public minParticipants = 2;

    uint256 public seedPool;
    uint256 public closeRewardPercent = 5; // 0.05% = 5/10000
    uint256 public maxCloseReward = 5e18; // 5 BLUE max

    enum RoundStatus { Pending, Active, WaitingVRF, Closed }

    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 totalTickets;
        uint256 uniqueWallets;
        address winner;
        address closer;
        uint256 closeReward;
        RoundStatus status;
        uint256 vrfRequestId;
        bool seeded;
    }

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => address[]) private roundParticipants;
    mapping(uint256 => mapping(address => uint256)) public roundTickets;
    mapping(uint256 => uint256) private vrfRequestToRound;

    bool public paused;

    event TicketPurchased(uint256 indexed roundId, address indexed participant, uint256 amount);
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event RoundClosing(uint256 indexed roundId, uint256 vrfRequestId, address closer, uint256 reward);
    event WinnerSelected(uint256 indexed roundId, address winner, uint256 prize);
    event RoundRefunded(uint256 indexed roundId, uint256 participants, uint256 totalRefunded);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @notice Constructor - CRITICAL: Must pass vrfCoordinator to VRFConsumerBaseV2Plus
     */
    constructor(
        address _blueToken,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address _treasuryWallet,
        address _developerWallet
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) Ownable(msg.sender) {
        require(_blueToken != address(0), "Invalid BLUE token");
        require(_vrfCoordinator != address(0), "Invalid VRF coordinator");
        require(_treasuryWallet != address(0), "Invalid treasury");
        require(_developerWallet != address(0), "Invalid developer");

        blueToken = IERC20(_blueToken);
        s_vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        treasuryWallet = _treasuryWallet;
        developerWallet = _developerWallet;

        _startNewRound();
    }

    function buyTickets(uint256 amount) external whenNotPaused nonReentrant {
        Round storage round = rounds[currentRoundId];
        require(round.status == RoundStatus.Pending || round.status == RoundStatus.Active, "Round not accepting tickets");
        require(amount >= minTickets, "Below minimum");
        require(roundTickets[currentRoundId][msg.sender] + amount <= maxTickets, "Exceeds maximum per wallet");

        blueToken.transferFrom(msg.sender, address(this), amount);

        if (roundTickets[currentRoundId][msg.sender] == 0) {
            roundParticipants[currentRoundId].push(msg.sender);
            round.uniqueWallets++;
        }

        roundTickets[currentRoundId][msg.sender] += amount;
        round.totalTickets += amount;
        round.prizePool += amount;

        emit TicketPurchased(currentRoundId, msg.sender, amount);

        // Auto-start round if first ticket and Pending
        if (round.status == RoundStatus.Pending && round.uniqueWallets >= minParticipants) {
            round.status = RoundStatus.Active;
            round.startTime = block.timestamp;
            round.endTime = block.timestamp + roundDuration;
            emit RoundStarted(currentRoundId, round.startTime, round.endTime);
        }
    }

    /**
     * @notice Close the current round and request VRF randomness
     * @dev FIXED: Uses VRFV2PlusClient.RandomWordsRequest struct (VRF v2.5)
     */
    function closeRound() external whenNotPaused nonReentrant {
        Round storage round = rounds[currentRoundId];

        require(round.status == RoundStatus.Active, "Round not active");
        require(block.timestamp >= round.endTime, "Round not ended");
        require(round.uniqueWallets >= minParticipants, "Not enough participants");

        round.status = RoundStatus.WaitingVRF;
        round.closer = msg.sender;

        uint256 reward = (round.prizePool * closeRewardPercent) / 10000;
        if (reward > maxCloseReward) reward = maxCloseReward;
        round.closeReward = reward;

        // Handle single participant case (no VRF needed)
        if (round.uniqueWallets == 1) {
            round.status = RoundStatus.Closed;
            round.winner = roundParticipants[currentRoundId][0];

            uint256 winnerPrize = round.prizePool - reward;
            if (winnerPrize > 0) {
                blueToken.transfer(round.winner, winnerPrize);
            }
            if (reward > 0) {
                blueToken.transfer(round.closer, reward);
            }

            emit WinnerSelected(currentRoundId, round.winner, winnerPrize);
            _startNewRound();
            return;
        }

        // *** CRITICAL FIX: VRF v2.5 uses STRUCT, not individual parameters ***
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1,
                // extraArgs is REQUIRED in v2.5 - specifies payment method
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = currentRoundId;

        emit RoundClosing(currentRoundId, requestId, msg.sender, reward);
    }

    /**
     * @notice VRF callback - called by VRF Coordinator with random words
     * @dev FIXED: This is internal and overrides VRFConsumerBaseV2Plus
     * @dev NO NEED for rawFulfillRandomWords - base contract handles it
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords  // MUST be 'memory', not 'calldata'
    ) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[roundId];

        require(round.status == RoundStatus.WaitingVRF, "Not waiting for VRF");

        address[] memory participants = roundParticipants[roundId];
        uint256 totalTickets = round.totalTickets;

        // Calculate winner based on ticket weights
        uint256 randomNumber = randomWords[0] % totalTickets;
        uint256 cumulativeTickets = 0;
        address winner;

        for (uint256 i = 0; i < participants.length; i++) {
            cumulativeTickets += roundTickets[roundId][participants[i]];
            if (randomNumber < cumulativeTickets) {
                winner = participants[i];
                break;
            }
        }

        round.status = RoundStatus.Closed;
        round.winner = winner;

        // Distribute funds
        uint256 totalPool = round.prizePool;
        uint256 reward = round.closeReward;

        uint256 winnerPrize = (totalPool * prizePercent) / 100;
        uint256 devShare = (totalPool * developerPercent) / 100;
        uint256 burnShare = (totalPool * burnPercent) / 100;
        uint256 seedShare = (totalPool * seedPercent) / 100;
        uint256 buybackShare = (totalPool * buybackPercent) / 100;

        if (winnerPrize > reward) {
            winnerPrize -= reward;
        }

        if (winnerPrize > 0) blueToken.transfer(winner, winnerPrize);
        if (reward > 0) blueToken.transfer(round.closer, reward);
        if (devShare > 0) blueToken.transfer(developerWallet, devShare);
        if (burnShare > 0) blueToken.transfer(BURN_ADDRESS, burnShare);
        if (buybackShare > 0) blueToken.transfer(treasuryWallet, buybackShare);

        seedPool += seedShare;

        emit WinnerSelected(roundId, winner, winnerPrize);
        _startNewRound();
    }

    function _startNewRound() internal {
        currentRoundId++;
        Round storage newRound = rounds[currentRoundId];

        newRound.roundId = currentRoundId;
        newRound.status = RoundStatus.Pending;

        if (seedPool > 0 && !newRound.seeded) {
            newRound.prizePool = seedPool;
            newRound.seeded = true;
            seedPool = 0;
        }

        emit RoundStarted(currentRoundId, 0, 0);
    }

    // Emergency functions
    function emergencyActivateRound(uint256 duration) external onlyOwner {
        Round storage round = rounds[currentRoundId];
        require(round.status == RoundStatus.Pending, "Round not pending");

        round.status = RoundStatus.Active;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + duration;

        emit RoundStarted(currentRoundId, round.startTime, round.endTime);
    }

    function emergencyCloseRound() external onlyOwner {
        Round storage round = rounds[currentRoundId];
        round.status = RoundStatus.Closed;
        _startNewRound();
    }

    function emergencyRefundRound() external onlyOwner {
        Round storage round = rounds[currentRoundId];
        require(round.status != RoundStatus.Closed, "Round closed");

        address[] memory participants = roundParticipants[currentRoundId];
        uint256 totalRefunded = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 tickets = roundTickets[currentRoundId][participant];
            if (tickets > 0) {
                blueToken.transfer(participant, tickets);
                totalRefunded += tickets;
            }
        }

        round.status = RoundStatus.Closed;
        emit RoundRefunded(currentRoundId, participants.length, totalRefunded);
        _startNewRound();
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    // Admin functions
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function setMinParticipants(uint256 _minParticipants) external onlyOwner {
        require(_minParticipants >= 1, "Min 1 participant");
        minParticipants = _minParticipants;
    }

    function setRoundDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 minutes && _duration <= 7 days, "Invalid duration");
        roundDuration = _duration;
    }

    function setTicketLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min < _max, "Invalid limits");
        minTickets = _min;
        maxTickets = _max;
    }

    function setVRFConfig(uint32 _gasLimit, uint16 _confirmations) external onlyOwner {
        callbackGasLimit = _gasLimit;
        requestConfirmations = _confirmations;
    }

    function updateWallets(address _treasury, address _developer) external onlyOwner {
        require(_treasury != address(0) && _developer != address(0), "Invalid addresses");
        treasuryWallet = _treasury;
        developerWallet = _developer;
    }

    // View functions
    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 prizePool,
        uint256 totalTickets,
        uint256 uniqueWallets,
        RoundStatus status
    ) {
        Round memory round = rounds[currentRoundId];
        return (
            round.roundId,
            round.startTime,
            round.endTime,
            round.prizePool,
            round.totalTickets,
            round.uniqueWallets,
            round.status
        );
    }

    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return roundParticipants[roundId];
    }

    function getUserTickets(uint256 roundId, address user) external view returns (uint256) {
        return roundTickets[roundId][user];
    }

    function canCloseRound() external view returns (bool, uint256, string memory) {
        Round memory round = rounds[currentRoundId];

        if (round.status != RoundStatus.Active) {
            return (false, 0, "Round not active");
        }
        if (block.timestamp < round.endTime) {
            return (false, 0, "Round not ended");
        }
        if (round.uniqueWallets < minParticipants) {
            return (false, 0, "Not enough participants");
        }

        uint256 reward = (round.prizePool * closeRewardPercent) / 10000;
        if (reward > maxCloseReward) reward = maxCloseReward;

        return (true, reward, "Can close");
    }

    function getDiagnostics() external view returns (
        bool isPaused,
        uint256 roundId,
        RoundStatus status,
        uint256 participants,
        uint256 minRequired,
        uint256 timeLeft,
        uint256 prizePool,
        uint256 subId
    ) {
        Round memory round = rounds[currentRoundId];
        int256 timeRemaining = int256(round.endTime) - int256(block.timestamp);

        return (
            paused,
            currentRoundId,
            round.status,
            round.uniqueWallets,
            minParticipants,
            timeRemaining > 0 ? uint256(timeRemaining) : 0,
            round.prizePool,
            subscriptionId
        );
    }
}
