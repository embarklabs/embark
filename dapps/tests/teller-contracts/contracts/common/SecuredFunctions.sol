pragma solidity >=0.5.0 <0.6.0;

import "../common/Ownable.sol";


contract SecuredFunctions is Ownable {

    mapping(address => bool) public allowedContracts;

    /// @notice Only allowed addresses and the same contract can invoke this function
    modifier onlyAllowedContracts {
        require(allowedContracts[msg.sender] || msg.sender == address(this), "Only allowed contracts can invoke this function");
        _;
    }

    /**
     * @dev Set contract addresses with special privileges to execute special functions
     * @param _contract Contract address
     * @param _allowed Is contract allowed?
     */
    function setAllowedContract (
        address _contract,
        bool _allowed
    ) public onlyOwner
    {
        allowedContracts[_contract] = _allowed;
    }
}
