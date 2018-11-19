pragma solidity ^0.5.0;

contract Loops {
  uint public storedData;

  constructor(uint initialValue) public {
    storedData = initialValue;
  }


  function set(uint x) public {
    for(uint i = storedData; i < x; i++) {
      uint newValue = storedData + x;
      storedData = newValue;
    }
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }
}
