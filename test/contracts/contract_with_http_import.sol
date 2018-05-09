pragma solidity ^0.4.7;
import "https://github.com/embark-framework/embark/blob/develop/test_apps/contracts_app/contracts/contract_args.sol";
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

}

