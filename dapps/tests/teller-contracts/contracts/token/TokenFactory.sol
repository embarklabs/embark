pragma solidity ^0.5.7;

contract TokenFactory {
  function createCloneToken(
          address _parentToken,
          uint _snapshotBlock,
          string memory _tokenName,
          uint8 _decimalUnits,
          string memory _tokenSymbol,
          bool _transfersEnabled
      ) public returns (address payable);
}
