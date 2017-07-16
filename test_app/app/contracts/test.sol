pragma solidity ^0.4.11;

library ZAMyLib {

  function add(uint _a, uint _b) returns (uint _c) {
    return _a + _b;
  }

}

contract Test {

  function testAdd() constant returns (uint _result) {
    return ZAMyLib.add(1, 2);
  }

}
