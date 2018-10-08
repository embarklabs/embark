pragma solidity ^0.4.25;

contract SimpleStorage {
  event SetCalled(uint x);
  uint public storedData;

  constructor(uint initialValue) public {
    storedData = initialValue;
  }

  function set(uint x) public {
    storedData = x;
    emit SetCalled(x);
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

}
