// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlueFaucet
 * @notice Simple faucet that distributes BLUE tokens for testing
 * @dev Users can claim tokens once per cooldown period
 */
contract BlueFaucet is Ownable {
    IERC20 public blueToken;

    uint256 public claimAmount = 1000 * 10**18; // 1000 BLUE per claim
    uint256 public cooldownTime = 24 hours; // 24 hour cooldown between claims

    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(address indexed user, uint256 amount);
    event FaucetFunded(address indexed funder, uint256 amount);
    event ClaimAmountUpdated(uint256 newAmount);
    event CooldownUpdated(uint256 newCooldown);

    constructor(address _blueToken) Ownable(msg.sender) {
        blueToken = IERC20(_blueToken);
    }

    /**
     * @notice Claim free BLUE tokens for testing
     */
    function claim() external {
        require(canClaim(msg.sender), "Must wait for cooldown");
        require(blueToken.balanceOf(address(this)) >= claimAmount, "Faucet empty");

        lastClaimTime[msg.sender] = block.timestamp;

        require(blueToken.transfer(msg.sender, claimAmount), "Transfer failed");

        emit TokensClaimed(msg.sender, claimAmount);
    }

    /**
     * @notice Check if a user can claim tokens
     */
    function canClaim(address user) public view returns (bool) {
        return block.timestamp >= lastClaimTime[user] + cooldownTime;
    }

    /**
     * @notice Get time until next claim is available
     */
    function timeUntilNextClaim(address user) public view returns (uint256) {
        if (canClaim(user)) return 0;
        return (lastClaimTime[user] + cooldownTime) - block.timestamp;
    }

    /**
     * @notice Get faucet balance
     */
    function faucetBalance() public view returns (uint256) {
        return blueToken.balanceOf(address(this));
    }

    /**
     * @notice Fund the faucet with BLUE tokens
     */
    function fund(uint256 amount) external {
        require(blueToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FaucetFunded(msg.sender, amount);
    }

    /**
     * @notice Update claim amount (owner only)
     */
    function setClaimAmount(uint256 newAmount) external onlyOwner {
        claimAmount = newAmount;
        emit ClaimAmountUpdated(newAmount);
    }

    /**
     * @notice Update cooldown time (owner only)
     */
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldownTime = newCooldown;
        emit CooldownUpdated(newCooldown);
    }

    /**
     * @notice Withdraw tokens from faucet (owner only)
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(blueToken.transfer(msg.sender, amount), "Transfer failed");
    }
}
