// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockBlueToken
 * @notice Simple ERC20 token for testing the raffle contract
 */
contract MockBlueToken is ERC20 {
    constructor() ERC20("Mock Blue Token", "BLUE") {
        // Mint 1 million tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @notice Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
