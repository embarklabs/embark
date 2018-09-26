pragma solidity ^0.4.23;

contract Branches {
  uint public lastComparison;
  uint public storedData;

  constructor(uint initialValue) public {
    storedData = initialValue;
  }

  function bigger(uint x) public returns (uint biggest) {
    lastComparison = x;

    if(x > storedData) {
      storedData = x;
      return x;
    } else {
      return storedData;
    }
  }

  function smaller(uint x) public returns (uint smallest) {
    lastComparison = x;

    if(x < storedData) {
      return x;
    } else {
      return storedData;
    }
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

  function smallFunctionWithoutStatements() public view returns (uint retVal) {
    if(false) return storedData * 10;
    if(true) return storedData * 20;
  }
}
