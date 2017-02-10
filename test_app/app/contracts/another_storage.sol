pragma solidity ^0.4.7;
contract AnotherStorage {
  address public simpleStorageAddress;

  function AnotherStorage(address addr) {
    simpleStorageAddress = addr;
  }

}
