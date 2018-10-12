pragma solidity ^0.4.25;

contract SimpleStorage {
  uint public storedData;
  address owner;

  constructor(uint initialValue) public {
    storedData = initialValue;
    owner = msg.sender;
  }

  function set(uint x) public {
    storedData = x;
    require(msg.sender != owner);
    storedData = x + 2;
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

}
