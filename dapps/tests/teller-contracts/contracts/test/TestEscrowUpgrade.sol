/* solium-disable security/no-block-members */
/* solium-disable no-empty-blocks */

pragma solidity >=0.5.0 <0.6.0;

import "../teller-network/Escrow.sol";

/**
 * @title Test Escrow Upgrade contract
 */
contract TestEscrowUpgrade is Escrow {

    constructor (
        address _fallbackArbitrator,
        address _relayer,
        address _arbitrationLicense,
        address _offerStore,
        address _userStore,
        address payable _feeDestination,
        uint _feeMilliPercent
      )
      Escrow(_fallbackArbitrator, _relayer, _arbitrationLicense, _offerStore, _userStore, _feeDestination, _feeMilliPercent)
      public {
    }

    uint private val;

    function getVal() public view returns (uint) {
        return val;
    }

    function setVal(uint _val) public {
      val = _val;
    }

}
