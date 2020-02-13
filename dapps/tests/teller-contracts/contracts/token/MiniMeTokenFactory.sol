pragma solidity ^0.5.7;

import "./TokenFactory.sol";
import "./MiniMeToken.sol";

////////////////
// MiniMeTokenFactory
////////////////

/**
 * @dev This contract is used to generate clone contracts from a contract.
 *  In solidity this is the way to create a contract from a contract of the
 *  same class
 */
contract MiniMeTokenFactory is TokenFactory {

    /**
     * @notice Update the DApp by creating a new token with new functionalities
     *  the msg.sender becomes the controller of this clone token
     * @param _parentToken Address of the token being cloned
     * @param _snapshotBlock Block of the parent token that will
     *  determine the initial distribution of the clone token
     * @param _tokenName Name of the new token
     * @param _decimalUnits Number of decimals of the new token
     * @param _tokenSymbol Token Symbol for the new token
     * @param _transfersEnabled If true, tokens will be able to be transferred
     * @return The address of the new token contract
     */
    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol,
        bool _transfersEnabled
    ) public returns (address payable) {
        MiniMeToken newToken = new MiniMeToken(
            address(this),
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _decimalUnits,
            _tokenSymbol,
            _transfersEnabled
            );

        newToken.changeController(msg.sender);
        return address(newToken);
    }
}