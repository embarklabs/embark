/* solium-disable security/no-block-members */
pragma solidity >=0.5.0 <0.6.0;

import "../common/Ownable.sol";
import "../token/ERC20Token.sol";
import "../token/SafeTransfer.sol";
import "./KyberNetworkProxy.sol";

/**
 * @title KyberFeeBurner
 * @dev Contract that holds assets for the purpose of trading them to SNT and burning them
 * @dev Assets come from the Escrow contract fees
 */
contract KyberFeeBurner is Ownable, SafeTransfer {

    address public SNT;
    address public burnAddress;
    address public walletId;
    KyberNetworkProxy public kyberNetworkProxy;
    uint public maxSlippageRate;

    // In Kyber's contracts, this is the address for ETH
    address constant internal ETH_TOKEN_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @param _snt Address of the SNT contract
     * @param _burnAddress Address where to burn the assets
     * @param _kyberNetworkProxy License contract instance address for arbitrators
     * @param _walletId Wallet address to send part of the fees to (used for the fee sharing program)
     * @param _maxSlippageRate Max slippage rate to accept a trade
     */
    constructor(address _snt, address _burnAddress, address _kyberNetworkProxy, address _walletId, uint _maxSlippageRate) public {
        SNT = _snt;
        burnAddress = _burnAddress;
        kyberNetworkProxy = KyberNetworkProxy(_kyberNetworkProxy);
        walletId = _walletId;

        setMaxSlippageRate(_maxSlippageRate);
    }

    event SNTAddressChanged(address sender, address prevSNTAddress, address newSNTAddress);

    /**
     * @dev Changes the SNT contract address
     * @param _snt New SNT contract address
     */
    function setSNT(address _snt) external onlyOwner {
        emit SNTAddressChanged(msg.sender, SNT, _snt);
        SNT = _snt;
    }

    event BurnAddressChanged(address sender, address prevBurnAddress, address newBurnAddress);

    /**
     * @dev Changes the burn address
     * @param _burnAddress New burn address
     */
    function setBurnAddress(address _burnAddress) external onlyOwner {
        emit BurnAddressChanged(msg.sender, burnAddress, _burnAddress);
        burnAddress = _burnAddress;
    }

    event KyberNetworkProxyAddressChanged(address sender, address prevKyberAddress, address newKyberAddress);

    /**
     * @dev Changes the KyberNetworkProxy contract address
     * @param _kyberNetworkProxy New KyberNetworkProxy address
     */
    function setKyberNetworkProxyAddress(address _kyberNetworkProxy) external onlyOwner {
        emit KyberNetworkProxyAddressChanged(msg.sender, address(kyberNetworkProxy), _kyberNetworkProxy);
        kyberNetworkProxy = KyberNetworkProxy(_kyberNetworkProxy);
    }

    event WalletIdChanged(address sender, address prevWalletId, address newWalletId);

    /**
     * @dev Changes the walletId address (for the fee sharing program)
     * @param _walletId New walletId address
     */
    function setWalletId(address _walletId) external onlyOwner {
        emit WalletIdChanged(msg.sender, walletId, _walletId);
        walletId = _walletId;
    }

    /**
     * @dev Changes the current max slippage rate
     * @param _newSlippageRate New slippage rate
     */
    function setMaxSlippageRate(uint _newSlippageRate) public onlyOwner {
        require(_newSlippageRate <= 10000, "Invalid slippage rate");
        emit SlippageRateChanged(msg.sender, maxSlippageRate, _newSlippageRate);
        maxSlippageRate = _newSlippageRate;
    }

    event SlippageRateChanged(address sender, uint oldRate, uint newRate);

    event Swap(address sender, address srcToken, address destToken, uint srcAmount, uint destAmount);


    /**
     * @dev Swaps the total balance of the selected asset to SNT and transfers it to the burn address
     * @param _token Address of the asset to trade
     */
    function swap(address _token) public {
        if (_token == address(0)) {
            swap(_token, address(this).balance);
        } else {
            ERC20Token t = ERC20Token(_token);
            swap(_token, t.balanceOf(address(this)));
        }
    }

    /**
     * @dev Swaps the selected asset to SNT and transfers it to the burn address
     * @param _token Address of the asset to trade
     * @param _amount Amount to swap
     */
    function swap(address _token, uint _amount) public {
        uint tokensToTradeRate;
        uint ratePer1Token;
        uint minAcceptedRate;

        uint destAmount;

        if (_token == address(0)) {
            require(_amount <= address(this).balance, "Invalid amount");

            (ratePer1Token,) = kyberNetworkProxy.getExpectedRate(ETH_TOKEN_ADDRESS, SNT, 1 ether);
            (tokensToTradeRate,) = kyberNetworkProxy.getExpectedRate(ETH_TOKEN_ADDRESS, SNT, _amount);
            minAcceptedRate = (ratePer1Token * (10000 - maxSlippageRate)) / 10000;
            require(tokensToTradeRate >= minAcceptedRate, "Rate is not acceptable");

            destAmount = kyberNetworkProxy.trade.value(_amount)(ETH_TOKEN_ADDRESS, _amount, SNT, burnAddress, 0 - uint256(1), tokensToTradeRate, walletId);
            emit Swap(msg.sender, ETH_TOKEN_ADDRESS, SNT, _amount, destAmount);
        } else {
            ERC20Token t = ERC20Token(_token);
            require(_amount <= t.balanceOf(address(this)), "Invalid amount");

            if (_token == SNT) {
                require(_safeTransfer(t, burnAddress, _amount), "SNT transfer failure");
                emit Swap(msg.sender, SNT, SNT, _amount, _amount);
                return;
            } else {
                // Mitigate ERC20 Approve front-running attack, by initially setting allowance to 0
                require(ERC20Token(_token).approve(address(kyberNetworkProxy), 0), "Failed to reset approval");

                // Set the spender's token allowance to tokenQty
                require(ERC20Token(_token).approve(address(kyberNetworkProxy), _amount), "Failed to approve trade amount");

                (ratePer1Token,) = kyberNetworkProxy.getExpectedRate(_token, SNT, 1 ether);
                (tokensToTradeRate,) = kyberNetworkProxy.getExpectedRate(_token, SNT, _amount);
                minAcceptedRate = (ratePer1Token * (10000 - maxSlippageRate)) / 10000;
                require(tokensToTradeRate >= minAcceptedRate, "Rate is not acceptable");

                destAmount = kyberNetworkProxy.trade(_token, _amount, SNT, burnAddress, 0 - uint256(1), tokensToTradeRate, walletId);

                emit Swap(msg.sender, _token, SNT, _amount, destAmount);
            }
        }
    }

    event EscapeTriggered(address sender, address token, uint amount);

    /**
     * @dev Exits the selected asset to the owner
     * @param _token Address of the asset to exit
     */
    function escape(address _token) external onlyOwner {
        if (_token == address(0)) {
            uint ethBalance = address(this).balance;
            address ownerAddr = address(uint160(owner()));
            (bool success, ) = ownerAddr.call.value(ethBalance)("");
            require(success, "Transfer failed.");
            emit EscapeTriggered(msg.sender, _token, ethBalance);
        } else {
            ERC20Token t = ERC20Token(_token);
            uint tokenBalance = t.balanceOf(address(this));
            require(_safeTransfer(t, owner(), tokenBalance), "Token transfer error");
            emit EscapeTriggered(msg.sender, _token, tokenBalance);
        }
    }

    function() payable external {
    }

}
