pragma solidity ^0.4.17;

import "/Users/iurimatias/Projects/Status/embark/test_dapps/test_app/.embark/contracts/embark-framework/embark/master/test_dapps/contracts_app/contracts/ownable.sol";
import "/Users/iurimatias/Projects/Status/embark/test_dapps/test_app/.embark/contracts/embark-framework/embark/master/test_dapps/contracts_app/contracts/contract_args.sol";


contract SimpleStorageWithHttpImport is Ownable {
  uint public storedData;

  function() public payable { }

  constructor(uint initialValue) public {
    storedData = initialValue;
  }

  function set(uint x) public {
    storedData = x;
    for(uint i = 0; i < 1000; i++) {
      storedData += i;
    }
  }

  function set2(uint x) public onlyOwner {
    storedData = x;
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

  function getS() public pure returns (string d) {
    return "hello";
  }

}
