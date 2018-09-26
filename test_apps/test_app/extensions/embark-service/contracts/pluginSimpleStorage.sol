pragma solidity ^0.4.18;
contract PluginStorage {
  address public simpleStorageAddress;
  address simpleStorageAddress2;

  constructor(address addr) public {
    simpleStorageAddress = addr;
  }

}
