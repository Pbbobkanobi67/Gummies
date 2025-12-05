// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBlueRaffle {
    function buyTickets(uint256 blueAmount) external;
    function requestDraw() external;
    function executeDraw() external;
    function cancelRound() external;
}

/**
 * @title ReentrancyAttacker
 * @notice Contract that attempts various reentrancy attack vectors
 * @dev Used for security testing only
 */
contract ReentrancyAttacker {
    IBlueRaffle public raffle;
    IERC20 public token;

    uint256 public attackAttempts;
    uint256 public maxAttempts;
    bool public attackActive;

    AttackVector public currentVector;

    enum AttackVector {
        BuyTicketsDuringBuy,
        RequestDrawDuringBuy,
        ExecuteDrawDuringBuy,
        BuyTicketsDuringDraw,
        BuyTicketsDuringExecute
    }

    event AttackAttempted(AttackVector vector, uint256 attempt);
    event AttackFailed(string reason);

    constructor(address _raffle, address _token) {
        raffle = IBlueRaffle(_raffle);
        token = IERC20(_token);
    }

    function setupAttack(AttackVector vector, uint256 attempts) external {
        currentVector = vector;
        maxAttempts = attempts;
        attackAttempts = 0;
        attackActive = true;
    }

    function buyTickets(uint256 amount) external {
        token.approve(address(raffle), amount);
        raffle.buyTickets(amount);
    }

    function requestDraw() external {
        raffle.requestDraw();
    }

    function executeDraw() external {
        raffle.executeDraw();
    }

    // This would be called if there was a callback mechanism
    function onTokenReceived() external {
        if (!attackActive || attackAttempts >= maxAttempts) return;

        attackAttempts++;
        emit AttackAttempted(currentVector, attackAttempts);

        try this._executeAttackVector() {} catch Error(string memory reason) {
            emit AttackFailed(reason);
        }
    }

    function _executeAttackVector() external {
        require(msg.sender == address(this), "Internal only");

        if (currentVector == AttackVector.BuyTicketsDuringBuy) {
            token.approve(address(raffle), 10 * 10**18);
            raffle.buyTickets(10 * 10**18);
        } else if (currentVector == AttackVector.RequestDrawDuringBuy) {
            raffle.requestDraw();
        } else if (currentVector == AttackVector.ExecuteDrawDuringBuy) {
            raffle.executeDraw();
        }
    }

    function withdrawTokens() external {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.transfer(msg.sender, balance);
        }
    }
}
