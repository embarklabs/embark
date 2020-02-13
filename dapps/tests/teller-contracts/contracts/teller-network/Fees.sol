pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";
import "../token/SafeTransfer.sol";
import "../common/Ownable.sol";
import "../common/ReentrancyGuard.sol";

/**
 * @title Fee utilities
 * @dev Fee registry, payment and withdraw utilities.
 */
contract Fees is Ownable, ReentrancyGuard, SafeTransfer {
    address payable public feeDestination;
    uint public feeMilliPercent;
    mapping(address => uint) public feeTokenBalances;
    mapping(uint => bool) public feePaid;

    event FeeDestinationChanged(address payable);
    event FeeMilliPercentChanged(uint amount);
    event FeesWithdrawn(uint amount, address token);

    /**
     * @param _feeDestination Address to send the fees once withdraw is called
     * @param _feeMilliPercent Millipercent for the fee off teh amount sold
     */
    constructor(address payable _feeDestination, uint _feeMilliPercent) public {
        feeDestination = _feeDestination;
        feeMilliPercent = _feeMilliPercent;
    }

    /**
     * @dev Set Fee Destination Address.
     *      Can only be called by the owner of the contract
     * @param _addr New address
     */
    function setFeeDestinationAddress(address payable _addr) external onlyOwner {
        feeDestination = _addr;
        emit FeeDestinationChanged(_addr);
    }

    /**
     * @dev Set Fee Amount
     * Can only be called by the owner of the contract
     * @param _feeMilliPercent New millipercent
     */
    function setFeeAmount(uint _feeMilliPercent) external onlyOwner {
        feeMilliPercent = _feeMilliPercent;
        emit FeeMilliPercentChanged(_feeMilliPercent);
    }

    /**
     * @dev Release fee to fee destination and arbitrator
     * @param _arbitrator Arbitrator address to transfer fee to
     * @param _value Value sold in the escrow
     * @param _isDispute Boolean telling if it was from a dispute. With a dispute, the arbitrator gets more
    */
    function _releaseFee(address payable _arbitrator, uint _value, address _tokenAddress, bool _isDispute) internal reentrancyGuard {
        uint _milliPercentToArbitrator;
        if (_isDispute) {
            _milliPercentToArbitrator = 100000; // 100%
        } else {
            _milliPercentToArbitrator = 10000; // 10%
        }

        uint feeAmount = _getValueOffMillipercent(_value, feeMilliPercent);
        uint arbitratorValue = _getValueOffMillipercent(feeAmount, _milliPercentToArbitrator);
        uint destinationValue = feeAmount - arbitratorValue;

        if (_tokenAddress != address(0)) {
            ERC20Token tokenToPay = ERC20Token(_tokenAddress);
            require(_safeTransfer(tokenToPay, _arbitrator, arbitratorValue), "Unsuccessful token transfer - arbitrator");
            if (destinationValue > 0) {
                require(_safeTransfer(tokenToPay, feeDestination, destinationValue), "Unsuccessful token transfer - destination");
            }
        } else {
            // EIP1884 fix
            (bool success, ) = _arbitrator.call.value(arbitratorValue)("");
            require(success, "Transfer failed.");

            if (destinationValue > 0) {
                // EIP1884 fix
                (bool success, ) = feeDestination.call.value(destinationValue)("");
                require(success, "Transfer failed.");

            }
        }
    }

    /**
     * @dev Calculate fee of an amount based in milliPercent
     * @param _value Value to obtain the fee
     * @param _milliPercent parameter to calculate the fee
     * @return Fee amount for _value
     */
    function _getValueOffMillipercent(uint _value, uint _milliPercent) internal pure returns(uint) {
        // To get the factor, we divide like 100 like a normal percent, but we multiply that by 1000 because it's a milliPercent
        // Eg: 1 % = 1000 millipercent => Factor is 0.01, so 1000 divided by 100 * 1000
        return (_value * _milliPercent) / (100 * 1000);
    }

    /**
     * @dev Pay fees for a transaction or element id
     *      This will only transfer funds if the fee  has not been paid
     * @param _from Address from where the fees are being extracted
     * @param _id Escrow id or element identifier to mark as paid
     * @param _value Value sold in the escrow
     * @param _tokenAddress Address of the token sold in the escrow
     */
    function _payFee(address _from, uint _id, uint _value, address _tokenAddress) internal {
        if (feePaid[_id]) return;

        feePaid[_id] = true;
        uint feeAmount = _getValueOffMillipercent(_value, feeMilliPercent);
        feeTokenBalances[_tokenAddress] += feeAmount;

        if (_tokenAddress != address(0)) {
            require(msg.value == 0, "Cannot send ETH with token address different from 0");

            ERC20Token tokenToPay = ERC20Token(_tokenAddress);
            require(_safeTransferFrom(tokenToPay, _from, address(this), feeAmount + _value), "Unsuccessful token transfer");
        } else {
            require(msg.value == (_value + feeAmount), "ETH amount is required");
        }
    }
}
