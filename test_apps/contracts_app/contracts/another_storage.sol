pragma solidity ^0.4.24;
contract AnotherStorage {
  address public simpleStorageAddress;
  address simpleStorageAddress2;

  constructor(address addr) public {
    simpleStorageAddress = addr;
  }

}
