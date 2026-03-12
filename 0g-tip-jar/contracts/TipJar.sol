// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TipJar {
    address public owner;

    event TipReceived(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Tip with an optional message logged via event
    receive() external payable {
        emit TipReceived(msg.sender, msg.value);
    }

    function tip() external payable {
        require(msg.value > 0, "Tip must be > 0");
        emit TipReceived(msg.sender, msg.value);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool ok, ) = owner.call{value: balance}("");
        require(ok, "Transfer failed");
        emit Withdrawn(owner, balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
