pragma solidity ^0.4.17;

contract SimpleStorageTest2 {
  uint public storedData;

  function() public payable { }

  function SimpleStorage(uint initialValue) public {
    storedData = initialValue;
  }

  function set(uint x) public {
    storedData = x;
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

}

