pragma solidity ^0.4.24;
contract AnotherStorage {
  address public simpleStorageAddress;
  address public ens;

  constructor(address addr, address _ens) public {
    simpleStorageAddress = addr;
    ens = _ens;
  }

}
