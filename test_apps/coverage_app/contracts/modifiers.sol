pragma solidity ^0.4.23;

contract Modifiers {
  uint public storedData;

  constructor(uint initialValue) public {
    storedData = initialValue;
  }

  modifier upTo(uint amount, uint desired) {
    require(
      desired <= amount,
      "Value is too high."
    );
    _;
  }

  function set(uint x) public upTo(1000, x) {
    storedData = x;
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }
}
