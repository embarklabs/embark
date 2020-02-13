pragma solidity >=0.5.0 <0.6.0;


/**
 * @title Proxiable
 * @dev Contracts that are meant to be upgradable must inherit from this contract
 */
contract Proxiable {
    bool internal _initialized;

    event Upgraded(address indexed implementation);

    function proxiableUUID() public pure returns (bytes32) {
        return 0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7;
    }

    /**
     * @notice Checks if the contract is initialized
     * @return Init status
     */
    function isInitialized() public view returns(bool) {
        return _initialized;
    }

    /**
     * @dev Update code logic
     * @param newAddress address where the contract logic is located at
     */
    function updateCodeAddress(address newAddress) internal {
        // Code position in storage is keccak256("PROXIABLE") = "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7"
        require(
            bytes32(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7) == Proxiable(newAddress).proxiableUUID(),
            "Not compatible"
        );
        assembly { // solium-disable-line
            sstore(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7, newAddress)
        }
        emit Upgraded(newAddress);
    }

}