pragma solidity ^0.4.18;
contract PluginStorage {
  address public simpleStorageAddress;
  address simpleStorageAddress2;

  function PluginStorage(address addr) public {
    simpleStorageAddress = addr;
  }

}
