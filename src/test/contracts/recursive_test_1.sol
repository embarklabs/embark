pragma solidity ^0.5.0;

import "./recursive_test_2.sol";

contract SimpleStorageRecursive1 {
    uint public storedData;

    constructor(uint initialValue) public {
        storedData = initialValue;
    }

    function set(uint x) public {
        storedData = x;
    }

    function get() public view returns (uint retVal) {
        return storedData;
    }
}