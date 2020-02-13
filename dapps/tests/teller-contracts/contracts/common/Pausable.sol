pragma solidity >=0.5.0 <0.6.0;

import "./Ownable.sol";

/**
 * @title Pausable
 * @dev Makes contract functions pausable by the owner
 */
contract Pausable is Ownable {

    event Paused();
    event Unpaused();

    bool public paused;

    constructor () internal {
        paused = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract must be unpaused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract must be paused");
        _;
    }

    /**
     * @dev Disables contract functions marked with "whenNotPaused" and enables the use of functions marked with "whenPaused"
     *      Only the owner of the contract can invoke this function
     */
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused();
    }

    /**
     * @dev Enables contract functions marked with "whenNotPaused" and disables the use of functions marked with "whenPaused"
     *      Only the owner of the contract can invoke this function
     */
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused();
    }
}