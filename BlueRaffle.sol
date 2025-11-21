// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract BlueRaffle is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    IERC20 public blueToken;
    VRFCoordinatorV2Interface public vrfCoordinator;

    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;

    address public treasuryWallet;
    address public developerWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint256 public currentRoundId;
    uint256 public roundDuration = 5 minutes; // Adjustable by owner

    // Distribution percentages (out of 100)
    uint8 public prizePercent = 94;
    uint8 public developerPercent = 2;
    uint8 public burnPercent = 2;
    uint8 public seedPercent = 1;  // Seeds next round
    uint8 public buybackPercent = 1; // Market buys BLUE

    // Entry limits
    uint256 public minTickets = 5e18;  // 5 BLUE minimum
    uint256 public maxTickets = 150e18; // 150 BLUE maximum per wallet
    uint256 public minParticipants = 2; // Minimum participants (adjustable)

    uint256 public seedPool; // Accumulated seed for next round

    uint256 public closeRewardPercent = 5; // 0.05% = 5/10000
    uint256 public maxCloseReward = 5e18; // 5 BLUE max

    bool public paused = false;

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
    mapping(uint256 => address[]) public roundParticipants;
    mapping(uint256 => mapping(address => uint256)) public userTickets;
    mapping(uint256 => uint256) public vrfRequestToRound;

    event TicketsPurchased(address indexed user, uint256 amount, uint256 roundId);
    event RoundStarted(uint256 indexed roundId, uint256 endTime, uint256 seedAmount);
    event RoundActivated(uint256 indexed roundId, uint256 endTime);
    event RoundClosing(uint256 indexed roundId, uint256 vrfRequestId, address closer, uint256 reward);
    event WinnerSelected(uint256 indexed roundId, address winner, uint256 prize);
    event BuybackExecuted(uint256 amount);
    event Paused();
    event Unpaused();

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(
        address _blueToken,
        address _treasuryWallet,
        address _developerWallet,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        blueToken = IERC20(_blueToken);
        treasuryWallet = _treasuryWallet;
        developerWallet = _developerWallet;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        _startNewRound();
    }

    function buyTickets(uint256 amount) external nonReentrant whenNotPaused {
        Round storage round = rounds[currentRoundId];
        require(round.status == RoundStatus.Pending || round.status == RoundStatus.Active, "Round not available");

        // Check entry limits
        require(amount >= minTickets, "Below minimum");
        uint256 userTotal = userTickets[currentRoundId][msg.sender] + amount;
        require(userTotal <= maxTickets, "Exceeds maximum per wallet");

        // If Active, check timer hasn't expired
        if (round.status == RoundStatus.Active) {
            require(block.timestamp < round.endTime, "Buying closed");
        }

        require(blueToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Calculate distributions
        uint256 toPrize = (amount * prizePercent) / 100;
        uint256 toDev = (amount * developerPercent) / 100;
        uint256 toBurn = (amount * burnPercent) / 100;
        uint256 toSeed = (amount * seedPercent) / 100;
        uint256 toBuyback = (amount * buybackPercent) / 100;

        round.prizePool += toPrize;
        round.totalTickets += amount;

        if (userTickets[currentRoundId][msg.sender] == 0) {
            roundParticipants[currentRoundId].push(msg.sender);
            round.uniqueWallets++;
        }
        userTickets[currentRoundId][msg.sender] += amount;

        // Distribute funds
        blueToken.transfer(developerWallet, toDev);
        blueToken.transfer(BURN_ADDRESS, toBurn);
        seedPool += toSeed;
        blueToken.transfer(treasuryWallet, toBuyback); // Treasury handles buybacks

        // Activate round if this is 2nd player
        if (round.status == RoundStatus.Pending && round.uniqueWallets >= 2) {
            round.status = RoundStatus.Active;
            round.startTime = block.timestamp;
            round.endTime = block.timestamp + roundDuration;
            emit RoundActivated(currentRoundId, round.endTime);
        }

        emit TicketsPurchased(msg.sender, amount, currentRoundId);
    }

    function closeRound() external nonReentrant {
        Round storage round = rounds[currentRoundId];
        require(round.status == RoundStatus.Active, "Round not active");
        require(block.timestamp >= round.endTime, "Too early to close");
        require(round.uniqueWallets >= minParticipants, "Not enough participants");

        round.status = RoundStatus.WaitingVRF;
        round.closer = msg.sender;

        address[] memory participants = roundParticipants[currentRoundId];

        // Calculate close reward
        uint256 reward = (round.prizePool * closeRewardPercent) / 10000;
        if (reward > maxCloseReward) {
            reward = maxCloseReward;
        }
        round.closeReward = reward;

        if (participants.length == 0) {
            round.status = RoundStatus.Closed;
            _startNewRound();
            return;
        }

        if (participants.length == 1) {
            round.winner = participants[0];
            round.status = RoundStatus.Closed;

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

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            uint64(subscriptionId),
            requestConfirmations,
            callbackGasLimit,
            1
        );

        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = currentRoundId;

        emit RoundClosing(currentRoundId, requestId, msg.sender, reward);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[roundId];

        require(round.status == RoundStatus.WaitingVRF, "Not waiting for VRF");

        address[] memory participants = roundParticipants[roundId];
        uint256 totalTickets = round.totalTickets;
        uint256 randomNumber = randomWords[0] % totalTickets;

        uint256 cumulativeTickets = 0;
        address winner;

        for (uint256 i = 0; i < participants.length; i++) {
            cumulativeTickets += userTickets[roundId][participants[i]];
            if (randomNumber < cumulativeTickets) {
                winner = participants[i];
                break;
            }
        }

        round.winner = winner;
        round.status = RoundStatus.Closed;

        uint256 winnerPrize = round.prizePool - round.closeReward;
        if (winnerPrize > 0) {
            blueToken.transfer(winner, winnerPrize);
        }
        if (round.closeReward > 0) {
            blueToken.transfer(round.closer, round.closeReward);
        }

        emit WinnerSelected(roundId, winner, winnerPrize);

        if (roundId == currentRoundId) {
            _startNewRound();
        }
    }

    function _startNewRound() internal {
        currentRoundId++;

        uint256 seedAmount = 0;
        if (seedPool > 0) {
            seedAmount = seedPool;
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
            closer: address(0),
            closeReward: 0,
            status: RoundStatus.Pending,
            vrfRequestId: 0,
            seeded: seedAmount > 0
        });

        emit RoundStarted(currentRoundId, 0, seedAmount);
    }

    function seedRound(uint256 amount) external onlyOwner {
        require(blueToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        Round storage round = rounds[currentRoundId];
        round.prizePool += amount;
        seedPool += amount;
    }

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

    function getRoundDetails(uint256 roundId) external view returns (
        address winner,
        address closer,
        uint256 closeReward,
        uint256 prizePool,
        RoundStatus status
    ) {
        Round memory round = rounds[roundId];
        return (
            round.winner,
            round.closer,
            round.closeReward,
            round.prizePool,
            round.status
        );
    }

    function canCloseRound() external view returns (bool, uint256, string memory) {
        Round memory round = rounds[currentRoundId];
        if (round.status != RoundStatus.Active) return (false, 0, "Round not active");
        if (block.timestamp < round.endTime) return (false, 0, "Too early");
        if (round.uniqueWallets < minParticipants) return (false, 0, "Not enough participants");

        uint256 reward = (round.prizePool * closeRewardPercent) / 10000;
        if (reward > maxCloseReward) reward = maxCloseReward;

        return (true, reward, "Ready to close");
    }

    function getUserTicketsInRound(uint256 roundId, address user) external view returns (uint256) {
        return userTickets[roundId][user];
    }

    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return roundParticipants[roundId];
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function setRoundDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 hours && _duration <= 30 days, "Invalid duration");
        roundDuration = _duration;
    }

    function setEntryLimits(uint256 _min, uint256 _max, uint256 _minParticipants) external onlyOwner {
        require(_min > 0 && _max > _min, "Invalid limits");
        minTickets = _min;
        maxTickets = _max;
        minParticipants = _minParticipants;
    }

    function setDistribution(uint8 _prize, uint8 _dev, uint8 _burn, uint8 _seed, uint8 _buyback) external onlyOwner {
        require(_prize + _dev + _burn + _seed + _buyback == 100, "Must sum to 100");
        prizePercent = _prize;
        developerPercent = _dev;
        burnPercent = _burn;
        seedPercent = _seed;
        buybackPercent = _buyback;
    }

    function setCloseReward(uint256 _percent, uint256 _maxReward) external onlyOwner {
        require(_percent <= 100, "Max 1%");
        closeRewardPercent = _percent;
        maxCloseReward = _maxReward;
    }

    function setTreasuryWallet(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryWallet = _treasury;
    }

    function setDeveloperWallet(address _developer) external onlyOwner {
        require(_developer != address(0), "Invalid address");
        developerWallet = _developer;
    }
}
