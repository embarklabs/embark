pragma solidity ^0.6.0;

contract SimpleStorage {
  uint public storedData;

  event Set(address caller, uint _value);

  constructor(uint initialValue) public {
    storedData = initialValue;
  }

  function set(uint x) public {
    storedData = x;
    emit Set(msg.sender, x);
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }
}
