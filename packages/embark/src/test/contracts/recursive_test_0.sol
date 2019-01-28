pragma solidity ^0.5.0;

import "./recursive_test_1.sol";

contract SimpleStorageRecursive0 {
    uint public storedData;

    constructor (uint initialValue) public {
        storedData = initialValue;
    }

    function set(uint x) public {
        storedData = x;
    }

    function get() public view returns (uint retVal) {
        return storedData;
    }
}