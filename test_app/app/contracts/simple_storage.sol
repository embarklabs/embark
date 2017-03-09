pragma solidity ^0.4.7;
contract SimpleStorage {
  uint public storedData;

  function SimpleStorage(uint initialValue) {
    storedData = initialValue;
  }

  function set(uint x) {
    storedData = x;
  }

  function get() constant returns (uint retVal) {
    return storedData;
  }

  function getS() constant returns (string d) {
    return "hello";
  }

}
