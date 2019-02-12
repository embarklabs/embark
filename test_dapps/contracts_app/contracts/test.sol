pragma solidity ^0.4.17;

library ZAMyLib {

  function add(uint _a, uint _b) public pure returns (uint _c) {
    return _a + _b;
  }

}

contract Test {
  address public addr;

  function testAdd() public pure returns (uint _result) {
    return ZAMyLib.add(1, 2);
  }

  function changeAddress(address _addr) public {
    addr = _addr;
  }

  function changeAddress2(address _addr) public {
    
  }

}
