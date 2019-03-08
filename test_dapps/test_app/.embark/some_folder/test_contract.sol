pragma solidity ^0.4.17;

import "../another_folder/another_test.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract SimpleStorageTest is Ownable {
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
