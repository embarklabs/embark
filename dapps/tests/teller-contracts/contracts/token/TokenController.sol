pragma solidity ^0.5.7;
/**
 * @dev The token controller contract must implement these functions
 */
interface TokenController {
    /**
     * @notice Called when `_owner` sends ether to the MiniMe Token contract
     * @param _owner The address that sent the ether to create tokens
     * @return True if the ether is accepted, false if it throws
     */
    function proxyPayment(address _owner) external payable returns(bool);

    /**
     * @notice Notifies the controller about a token transfer allowing the
     *  controller to react if desired
     * @param _from The origin of the transfer
     * @param _to The destination of the transfer
     * @param _amount The amount of the transfer
     * @return False if the controller does not authorize the transfer
     */
    function onTransfer(address _from, address _to, uint _amount) external returns(bool);

    /**
     * @notice Notifies the controller about an approval allowing the
     *  controller to react if desired
     * @param _owner The address that calls `approve()`
     * @param _spender The spender in the `approve()` call
     * @param _amount The amount in the `approve()` call
     * @return False if the controller does not authorize the approval
     */
    function onApprove(address _owner, address _spender, uint _amount) external
        returns(bool);
}
