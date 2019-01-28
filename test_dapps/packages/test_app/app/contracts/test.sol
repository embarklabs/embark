pragma solidity ^0.4.17;

library ZAMyLib {

  function add(uint _a, uint _b) public pure returns (uint _c) {
    return _a + _b;
  }

}

contract Test {
  address public addr;
  address public ens;

  function testAdd() public pure returns (uint _result) {
    return ZAMyLib.add(1, 2);
  }

  function changeAddress(address _addr) public {
    addr = _addr;
  }

  function changeENS(address _ens) public {
    ens = _ens;
  }

}
