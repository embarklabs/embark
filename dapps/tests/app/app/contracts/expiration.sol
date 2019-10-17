pragma solidity ^0.4.25;

contract Expiration {
  uint public expirationTime; // In milliseconds
  address owner;

  constructor(uint expiration) public {
    expirationTime = expiration;
  }

  function isExpired() public view returns (bool retVal) {
//    retVal = block.timestamp;
    retVal = expirationTime < block.timestamp * 1000;
    return retVal;
  }
}
