pragma solidity >=0.5.0 <0.6.0;
/**
 * @title KyberNetworkProxy
 * @dev Mock of the KyberNetworkProxy. Only used in development
 */
contract KyberNetworkProxy {

    constructor() public {
    }

    /**
     * @dev Get a mocked up rate for the trade
     */
    function getExpectedRate(
        address /* src */,
        address /* dest */,
        uint /* srcQty */
        )
        public pure
        returns(uint expectedRate, uint slippageRate)
    {
        return (32749000000000000000, 31766530000000000000);
    }

    /// @notice use token address ETH_TOKEN_ADDRESS for ether
    /// @dev makes a trade between src and dest token and send dest token to destAddress
    /// @param maxDestAmount A limit on the amount of dest tokens
    /// @return amount of actual dest tokens
    function trade(
        address /* src */,
        uint /* srcAmount */,
        address /* dest */,
        address /* destAddress */,
        uint  maxDestAmount,
        uint /* minConversionRate */,
        address /* walletId */
    )
        public
        payable
        returns(uint)
    {
      return maxDestAmount;
    }

    /// @dev makes a trade between src and dest token and send dest tokens to msg sender
    /// @return amount of actual dest tokens
    function swapTokenToToken(
        address /* src */,
        uint /* srcAmount */,
        address /* dest */,
        uint /* minConversionRate */
    )
        public pure
        returns(uint)
    {
        return 100;
    }

    /// @dev makes a trade from Ether to token. Sends token to msg sender
    /// @return amount of actual dest tokens
    function swapEtherToToken(
        address /* token */,
        uint /* minConversionRate */
    ) public payable returns(uint) {
        return 200;
    }
}
