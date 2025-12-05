// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IBlueRaffle {
    function buyTickets(uint256 blueAmount) external;
    function requestDraw() external;
    function executeDraw() external;
}

/**
 * @title MaliciousToken
 * @notice ERC20 token that attempts reentrancy attacks during transfers
 * @dev Used for security testing - attempts to re-enter raffle during transfer callbacks
 */
contract MaliciousToken is ERC20 {
    address public target;
    bool public attackOnTransfer;
    bool public attackOnTransferFrom;
    uint256 public attackCount;
    uint256 public maxAttacks;
    AttackType public attackType;

    enum AttackType { None, BuyTickets, RequestDraw, ExecuteDraw }

    constructor() ERC20("Malicious Token", "EVIL") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function setAttackTarget(address _target) external {
        target = _target;
    }

    function setAttackOnTransfer(bool _attack) external {
        attackOnTransfer = _attack;
    }

    function setAttackOnTransferFrom(bool _attack) external {
        attackOnTransferFrom = _attack;
    }

    function setAttackType(AttackType _type) external {
        attackType = _type;
    }

    function setMaxAttacks(uint256 _max) external {
        maxAttacks = _max;
    }

    function resetAttackCount() external {
        attackCount = 0;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        bool result = super.transfer(to, amount);

        if (attackOnTransfer && target != address(0) && attackCount < maxAttacks) {
            attackCount++;
            _executeAttack();
        }

        return result;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        bool result = super.transferFrom(from, to, amount);

        if (attackOnTransferFrom && target != address(0) && attackCount < maxAttacks) {
            attackCount++;
            _executeAttack();
        }

        return result;
    }

    function _executeAttack() internal {
        if (attackType == AttackType.BuyTickets) {
            try IBlueRaffle(target).buyTickets(10 * 10**18) {} catch {}
        } else if (attackType == AttackType.RequestDraw) {
            try IBlueRaffle(target).requestDraw() {} catch {}
        } else if (attackType == AttackType.ExecuteDraw) {
            try IBlueRaffle(target).executeDraw() {} catch {}
        }
    }
}
