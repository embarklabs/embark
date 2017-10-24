pragma solidity ^0.4.17;
contract AnotherStorage {
  address public simpleStorageAddress;
  address simpleStorageAddress2;

  function AnotherStorage(address addr) public {
    simpleStorageAddress = addr;
  }

}
