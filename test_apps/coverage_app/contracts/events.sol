pragma solidity ^0.4.23;

contract Events {
  uint public balance;

  event Deposit(uint value);

  constructor(uint initialValue) public {
    balance = initialValue;
  }

  function deposit(uint x) public {
    balance = balance + x;
    emit Deposit(x);
  }
}
