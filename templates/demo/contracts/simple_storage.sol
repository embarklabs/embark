pragma solidity ^0.4.23;


contract SimpleStorage {
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
