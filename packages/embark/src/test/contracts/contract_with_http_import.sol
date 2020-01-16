pragma solidity ^0.5.0;

import "https://github.com/embarklabs/embark/blob/master/dapps/tests/contracts/contracts/contract_args.sol";

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
