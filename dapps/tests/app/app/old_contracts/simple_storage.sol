pragma solidity ^0.4.25;

contract SimpleStorage {
  uint public storedData;
  address public registar;
  address owner;
  event EventOnSet2(bool passed, string message);

  constructor(uint initialValue) public {
    storedData = initialValue;
    owner = msg.sender;
  }

  function set(uint x) public {
    storedData = x;
    //require(msg.sender == owner);
    //require(msg.sender == 0x0);
    //storedData = x + 2;
  }

  function set2(uint x) public {
    storedData = x;
    emit EventOnSet2(true, "hi");
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

  function getS() public pure returns (string d) {
    return "hello";
  }

  function setRegistar(address x) public {
    registar = x;
  }

}
