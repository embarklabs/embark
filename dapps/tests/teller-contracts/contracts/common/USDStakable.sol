pragma solidity >=0.5.0 <0.6.0;

import "./Stakable.sol";
import "./Medianizer.sol";


/**
 * @title USDStakable
 * @dev Staking contract that is integrated with MakerDAO's medianizer to obtain stake prices in USD, with initial price being always ~1USD
 */
contract USDStakable is Stakable {
    Medianizer public medianizer;
    uint public basePrice;

    /**
     * @param _burnAddress Address where the slashed stakes are going to be sent
     * @param _medianizer Medianizer contract address
     */
    constructor(address payable _burnAddress, address _medianizer) internal Stakable(_burnAddress) {
        burnAddress = _burnAddress;
        basePrice = 1 ether;  // 1 usd
        medianizer = Medianizer(_medianizer);
    }

    event BasePriceChanged(address sender, uint prevPrice, uint newPrice);

    /**
     * @dev Changes the base price
     * @param _basePrice New burn address
     */
    function setBasePrice(uint _basePrice) external onlyOwner {
        emit BasePriceChanged(msg.sender, basePrice, _basePrice);
        basePrice = _basePrice;
    }

    event MedianizerChanged(address sender, address _oldAddress, address _newAddress);

    /**
     * @dev Changes the medianizer address
     * @param _medianizer New medianizer address
     */
    function setMedianizer(address _medianizer) external onlyOwner {
        emit MedianizerChanged(msg.sender, address(medianizer), _medianizer);
        medianizer = Medianizer(_medianizer);
    }

    /**
     * @notice Get amount to stake for the next offer
     * @param _owner Address for which the stake amount will be calculated
     * @return Amount to stake in wei
     */
    function getAmountToStake(address _owner) public view returns(uint) {
        uint stakeCnt = stakeCounter[_owner] + 1;

        uint mweiPrice = basePrice * 1000000;
        uint daiPrice = uint256(medianizer.read());
        uint oneUsdEth = (mweiPrice / daiPrice) * 1 szabo;

        uint amountToStake = oneUsdEth * (stakeCnt * stakeCnt) / 17; // y = basePrice * x^2/17

        if (amountToStake < oneUsdEth) {
            return oneUsdEth;
        }

        return amountToStake;
    }
}
