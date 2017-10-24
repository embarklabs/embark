pragma solidity ^0.4.17;

library ZAMyLib {

  function add(uint _a, uint _b) public pure returns (uint _c) {
    return _a + _b;
  }

}

contract Test {

  function testAdd() public pure returns (uint _result) {
    return ZAMyLib.add(1, 2);
  }

}
