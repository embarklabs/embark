pragma solidity ^0.4.7;
contract SimpleStorage {
  uint public storedData;
  import "https://github.com/embark-framework/embark/blob/develop/test_apps/contracts_app/contracts/contract_args.sol";

  function SimpleStorage(uint initialValue) {
    storedData = initialValue;
  }

  function set(uint x) {
    storedData = x;
  }

  function get() constant returns (uint retVal) {
    return storedData;
  }

}

