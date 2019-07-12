pragma solidity ^0.4.25;

import "ownable.sol";

contract SimpleStorageTest is Ownable {
  uint public storedData;
  address owner;

  constructor(uint initialValue, address _owner) public {
    storedData = initialValue;
    owner = _owner;
  }

  function set(uint x) public onlyOwner {
    storedData = x;
    require(msg.sender != owner);
    storedData = x + 2;
  }

  function set2(uint x) public onlyOwner {
    storedData = x;
    storedData = x + 2;
  }

  function test(uint x) public {
    uint value = 1;
    assembly {
      let a := 1
      let b := 2
      revert(0, 0)
    }
    value = 2;
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

}
