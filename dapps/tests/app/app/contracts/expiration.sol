pragma solidity ^0.4.25;

contract Expiration {
  uint256 public expirationTime; // Unix epoch (seconds since 1/1/1970)
  address owner;

  constructor(uint expiration) public {
    expirationTime = expiration;
  }

  function isExpired() public view returns (bool retVal) {
    retVal = block.timestamp > expirationTime;
    return retVal;
  }
}
