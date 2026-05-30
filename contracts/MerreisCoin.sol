// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MerreisCoin
/// @notice Testnet-only ERC-20 prototype for the Tazzo Strike economy experiments.
/// @dev Keep this contract in sandbox until legal, security, and tokenomics reviews are complete.
contract MerreisCoin is ERC20, Ownable {
    uint8 private immutable customDecimals;
    uint256 public immutable maxSupply;

    event GameMint(address indexed to, uint256 amount, string reason);

    constructor(address initialOwner, uint8 tokenDecimals, uint256 supplyCap)
        ERC20("MerreisCoin", "MER")
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "MerreisCoin: owner zero");
        require(tokenDecimals <= 18, "MerreisCoin: decimals too high");
        require(supplyCap > 0, "MerreisCoin: cap zero");
        customDecimals = tokenDecimals;
        maxSupply = supplyCap;
    }

    function decimals() public view override returns (uint8) {
        return customDecimals;
    }

    function mint(address to, uint256 amount, string calldata reason) external onlyOwner {
        require(to != address(0), "MerreisCoin: recipient zero");
        require(amount > 0, "MerreisCoin: amount zero");
        require(totalSupply() + amount <= maxSupply, "MerreisCoin: cap exceeded");
        _mint(to, amount);
        emit GameMint(to, amount, reason);
    }
}
