/* solium-disable security/no-block-members */
/* solium-disable security/no-inline-assembly */

pragma solidity >=0.5.0 <0.6.0;


/**
 * @title Proxy
 * @dev EIP1822
 */
contract Proxy {
    /**
     * @param constructData Constructor input data for initializing the proxy
     * @param contractLogic Address of the contract used as implementation logic for the proxy
     */
    constructor(bytes memory constructData, address contractLogic) public {
        // save the code address
        assembly { // solium-disable-line
            sstore(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7, contractLogic)
        }

        if (constructData.length == 0) {
            return;
        }

        (bool success, bytes memory _) = contractLogic.delegatecall(constructData); // solium-disable-line
        require(success, "Construction failed");
    }

    /**
     * @dev Fallback function allowing to perform a delegatecall to the given implementation.
     * This function will return whatever the implementation call returns
     */
    function() external payable {
        assembly { // solium-disable-line
            let contractLogic := sload(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7)
            calldatacopy(0x0, 0x0, calldatasize)
            let success := delegatecall(sub(gas, 10000), contractLogic, 0x0, calldatasize, 0, 0)
            let retSz := returndatasize
            returndatacopy(0, 0, retSz)
            switch success
            case 0 {
                revert(0, retSz)
            }
            default {
                return(0, retSz)
            }
        }
    }

    /**
     * @dev Tells the address of the implementation where every call will be delegated.
     * @return address of the implementation to which it will be delegated
     */
    function implementation() public view returns (address) {
        address contractLogic;
        assembly { // solium-disable-line
           contractLogic := sload(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7)
        }
        return contractLogic;
    }

    /**
     * @dev EIP897 proxy type
     * @return 1 to indicate not upgradable proxy
     */
    function proxyType() public pure returns (uint256) {
        return 1;
    }
}