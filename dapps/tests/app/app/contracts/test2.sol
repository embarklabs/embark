pragma solidity ^0.4.17;

import "./zlib2.sol";

contract Test2 {
  address public addr;

  function testAdd() public pure returns (uint _result) {
    return ZAMyLib2.add(1, 2);
  }

  function changeAddress(address _addr) public {
    addr = _addr;
  }

}
