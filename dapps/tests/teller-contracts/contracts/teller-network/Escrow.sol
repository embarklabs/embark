 /* solium-disable security/no-block-members */
/* solium-disable security/no-inline-assembly */

pragma solidity >=0.5.0 <0.6.0;

import "../common/Pausable.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";
import "../token/SafeTransfer.sol";
import "./ArbitrationLicense.sol";
import "./License.sol";
import "./UserStore.sol";
import "./OfferStore.sol";
import "./Fees.sol";
import "./Arbitrable.sol";
import "./IEscrow.sol";
import "../proxy/Proxiable.sol";

/**
 * @title Escrow
 * @dev Escrow contract for selling ETH and ERC20 tokens
 */
contract Escrow is IEscrow, Pausable, MessageSigned, Fees, Arbitrable, Proxiable {

    EscrowTransaction[] public transactions;

    address public relayer;
    OfferStore public offerStore;
    UserStore public userStore;


    event Created(uint indexed offerId, address indexed seller, address indexed buyer, uint escrowId);
    event Funded(uint indexed escrowId, address indexed buyer, uint expirationTime, uint amount);
    event Paid(uint indexed escrowId, address indexed seller);
    event Released(uint indexed escrowId, address indexed seller, address indexed buyer, address destination, bool isDispute);
    event Canceled(uint indexed escrowId, address indexed seller, address indexed buyer, bool isDispute);
    event DestinationUpdated(uint indexed escrowId, address indexed buyer, address newAddress);
    event Rating(uint indexed offerId, address indexed participant, uint indexed escrowId, uint rating, bool ratingSeller);

    /**
     * @param _relayer EscrowRelay contract address
     * @param _fallbackArbitrator Default arbitrator to use after timeout on solving arbitrations
     * @param _arbitratorLicenses License contract instance address for arbitrators
     * @param _offerStore OfferStore contract address
     * @param _userStore UserStore contract address
     * @param _feeDestination Address where the fees are going to be sent
     * @param _feeMilliPercent Percentage applied as a fee to each escrow. 1000 == 1%
     */
    constructor(
        address _relayer,
        address _fallbackArbitrator,
        address _arbitratorLicenses,
        address _offerStore,
        address _userStore,
        address payable _feeDestination,
        uint _feeMilliPercent)
        Fees(_feeDestination, _feeMilliPercent)
        Arbitrable(_arbitratorLicenses, _fallbackArbitrator)
        public {
        _initialized = true;
        relayer = _relayer;
        offerStore = OfferStore(_offerStore);
        userStore = UserStore(_userStore);
    }

    /**
     * @dev Initialize contract (used with proxy). Can only be called once
     * @param _fallbackArbitrator Default arbitrator to use after timeout on solving arbitrations
     * @param _relayer EscrowRelay contract address
     * @param _arbitratorLicenses License contract instance address for arbitrators
     * @param _offerStore OfferStore contract address
     * @param _userStore UserStore contract address
     * @param _feeDestination Address where the fees are going to be sent
     * @param _feeMilliPercent Percentage applied as a fee to each escrow. 1000 == 1%
     */
    function init(
        address _fallbackArbitrator,
        address _relayer,
        address _arbitratorLicenses,
        address _offerStore,
        address _userStore,
        address payable _feeDestination,
        uint _feeMilliPercent
    ) external {
        assert(_initialized == false);

        _initialized = true;

        fallbackArbitrator = _fallbackArbitrator;
        arbitratorLicenses = ArbitrationLicense(_arbitratorLicenses);
        offerStore = OfferStore(_offerStore);
        userStore = UserStore(_userStore);
        relayer = _relayer;
        feeDestination = _feeDestination;
        feeMilliPercent = _feeMilliPercent;
        paused = false;
        arbitrationTimeout = 5 days;

        _setOwner(msg.sender);
    }
    
    /**
     * @dev Update arbitration timeout. Can only be called by owner
     * @param _newTimeout new timeout in seconds
     */
    function setArbitrationTimeout(uint _newTimeout) public onlyOwner {
        arbitrationTimeout = _newTimeout;
    }

    /**
     * @dev Update proxy implementation. Can only be called by owner
     * @param _newCode New contract implementation address
     */
    function updateCode(address _newCode) public onlyOwner {
        updateCodeAddress(_newCode);
    }

    /**
     * @dev Update relayer contract address. Can only be called by the contract owner
     * @param _relayer EscrowRelay contract address
     */
    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    /**
     * @dev Update fallback arbitrator. Can only be called by the contract owner
     * @param _fallbackArbitrator New fallback arbitrator
     */
    function setFallbackArbitrator(address _fallbackArbitrator) external onlyOwner {
        fallbackArbitrator = _fallbackArbitrator;
    }

    /**
     * @dev Update license contract addresses
     * @param _arbitratorLicenses License contract instance address for arbitrators
     */
    function setArbitratorLicense(address _arbitratorLicenses) external onlyOwner {
        arbitratorLicenses = ArbitrationLicense(_arbitratorLicenses);
    }

    /**
     * @dev Update Metadata Stores contract address
     * @param _offerStore OfferStore contract address
     * @param _userStore UserStore contract address
     */
    function setMetadataStore(address _offerStore, address _userStore) external onlyOwner {
        offerStore = OfferStore(_offerStore);
        userStore = UserStore(_userStore);
    }

    /**
     * @dev Escrow creation logic. Requires contract to be unpaused
     * @param _buyer Buyer Address
     * @param _destination Address that will receive the crypto
     * @param _offerId Offer
     * @param _tokenAmount Amount buyer is willing to trade
     * @param _fiatAmount Indicates how much FIAT will the user pay for the tokenAmount
     * @return Id of the Escrow
     */
    function _createTransaction(
        address payable _buyer,
        address payable _destination,
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount
    ) internal whenNotPaused returns(uint escrowId)
    {
        address payable seller;
        address payable arbitrator;
        bool deleted;
        address token;

        (token, , , , , , seller, arbitrator, deleted) = offerStore.offer(_offerId);

        require(!deleted, "Offer is not valid");
        require(seller != _buyer, "Seller and Buyer must be different");
        require(arbitrator != _buyer && arbitrator != address(0), "Cannot buy offers where buyer is arbitrator");
        require(_tokenAmount != 0 && _fiatAmount != 0, "Trade amounts cannot be 0");

        escrowId = transactions.length++;

        EscrowTransaction storage trx = transactions[escrowId];

        trx.offerId = _offerId;
        trx.token = token;
        trx.buyer = _buyer;
        trx.seller = seller;
        trx.destination = _destination;
        trx.arbitrator = arbitrator;
        trx.tokenAmount = _tokenAmount;
        trx.fiatAmount = _fiatAmount;

        emit Created(
            _offerId,
            seller,
            _buyer,
            escrowId
        );
    }

    /**
     * @notice Create a new escrow
     * @param _offerId Offer
     * @param _tokenAmount Amount buyer is willing to trade
     * @param _fiatAmount Indicates how much FIAT will the user pay for the tokenAmount
     * @param _destination Address that will receive the crypto
     * @param _contactData Contact Data   ContactType:UserId
     * @param _location The location on earth
     * @param _username The username of the user
     * @return Id of the new escrow
     * @dev Requires contract to be unpaused.
     */
    function createEscrow(
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount,
        address payable _destination,
        string memory _contactData,
        string memory _location,
        string memory _username
    ) public returns(uint escrowId) {
        userStore.addOrUpdateUser(msg.sender, _contactData, _location, _username);
        escrowId = _createTransaction(msg.sender, _destination, _offerId, _tokenAmount, _fiatAmount);
    }

    /**
     * @notice Create a new escrow
     * @param _offerId Offer
     * @param _tokenAmount Amount buyer is willing to trade
     * @param _fiatAmount Indicates how much FIAT will the user pay for the tokenAmount
     * @param _destination Address that will receive the crypto
     * @param _contactData Contact Data   ContactType:UserId
     * @param _username The username of the user
     * @param _nonce The nonce for the user (from UserStore.user_nonce(address))
     * @param _signature buyer's signature
     * @return Id of the new escrow
     * @dev Requires contract to be unpaused.
     *      The seller needs to be licensed.
     */
    function createEscrow(
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount,
        address payable _destination,
        string memory _contactData,
        string memory _location,
        string memory _username,
        uint _nonce,
        bytes memory _signature
    ) public returns(uint escrowId) {
        address payable _buyer = userStore.addOrUpdateUser(_signature, _contactData, _location, _username, _nonce);
        escrowId = _createTransaction(_buyer, _destination, _offerId, _tokenAmount, _fiatAmount);
    }

   /**
     * @dev Relay function for creating a transaction
     *      Can only be called by relayer address
     * @param _sender Address marking the transaction as paid
     * @param _offerId Offer
     * @param _tokenAmount Amount buyer is willing to trade
     * @param _fiatAmount Indicates how much FIAT will the user pay for the tokenAmount
     * @param _destination Address that will receive the crypto
     * @param _contactData Contact Data   ContactType:UserId
     * @param _location The location on earth
     * @param _username The username of the user
     * @return Id of the new escrow
     * @dev Requires contract to be unpaused.
     *      The seller needs to be licensed.
     */
    function createEscrow_relayed(
        address payable _sender,
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount,
        address payable _destination,
        string calldata _contactData,
        string calldata _location,
        string calldata _username
    ) external returns(uint escrowId) {
        assert(msg.sender == relayer);

        userStore.addOrUpdateUser(_sender, _contactData, _location, _username);
        escrowId = _createTransaction(_sender, _destination,  _offerId, _tokenAmount, _fiatAmount);
    }

    function updateDestination(uint _escrowId, address payable _destination) external whenNotPaused {
        EscrowTransaction storage trx = transactions[_escrowId];

        EscrowStatus mStatus = trx.status;
        require(mStatus == EscrowStatus.FUNDED || mStatus == EscrowStatus.CREATED || mStatus == EscrowStatus.PAID,
                "Only transactions in created, funded or paid state can have their destination updated");

        require(trx.buyer == msg.sender, "Only the buyer can invoke this function");

        trx.destination = _destination;

        emit DestinationUpdated(_escrowId, trx.buyer, _destination);
    }

    /**
     * @notice Fund a new escrow
     * @param _escrowId Id of the escrow
     * @dev Requires contract to be unpaused.
     *      The expiration time must be at least 10min in the future
     *      For eth transfer, _amount must be equals to msg.value, for token transfer, requires an allowance and transfer valid for _amount
     */
    function fund(uint _escrowId) external payable whenNotPaused {
        _fund(msg.sender, _escrowId);
    }

    /**
     * @dev Escrow funding logic
     * @param _from Seller address
     * @param _escrowId Id of the escrow
     * @dev Requires contract to be unpaused.
     *      The expiration time must be at least 10min in the future
     *      For eth transfer, _amount must be equals to msg.value, for token transfer, requires an allowance and transfer valid for _amount
     */
    function _fund(address _from, uint _escrowId) internal whenNotPaused {
        require(transactions[_escrowId].seller == _from, "Only the seller can invoke this function");
        require(transactions[_escrowId].status == EscrowStatus.CREATED, "Invalid escrow status");

        transactions[_escrowId].expirationTime = block.timestamp + 5 days;
        transactions[_escrowId].status = EscrowStatus.FUNDED;

        uint tokenAmount = transactions[_escrowId].tokenAmount;

        address token = transactions[_escrowId].token;

        _payFee(_from, _escrowId, tokenAmount, token);

        emit Funded(_escrowId, transactions[_escrowId].buyer, block.timestamp + 5 days, tokenAmount);
    }

    /**
     * @notice Create and fund a new escrow, as a seller, once you get a buyer signature
     * @param _offerId Offer
     * @param _tokenAmount Amount buyer is willing to trade
     * @param _fiatAmount Indicates how much FIAT will the user pay for the tokenAmount
     * @param _bContactData Contact Data   ContactType:UserId
     * @param _bLocation The location on earth
     * @param _bUsername The username of the user
     * @param _bNonce The nonce for the user (from userStore.user_nonce(address))
     * @param _bSignature buyer's signature
     * @return Id of the new escrow
     * @dev Requires contract to be unpaused.
     *      Restrictions from escrow creation and funding applies
     */
    function createAndFund (
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount,
        string memory _bContactData,
        string memory _bLocation,
        string memory _bUsername,
        uint _bNonce,
        bytes memory _bSignature
    ) public payable returns(uint escrowId) {
        address payable _buyer = userStore.addOrUpdateUser(_bSignature, _bContactData, _bLocation, _bUsername, _bNonce);
        escrowId = _createTransaction(_buyer, _buyer, _offerId, _tokenAmount, _fiatAmount);
        _fund(msg.sender, escrowId);
    }

    /**
     * @dev Buyer marks transaction as paid
     * @param _sender Address marking the transaction as paid
     * @param _escrowId Id of the escrow
     */
    function _pay(address _sender, uint _escrowId) internal {
        EscrowTransaction storage trx = transactions[_escrowId];

        require(trx.status == EscrowStatus.FUNDED, "Transaction is not funded");
        require(trx.expirationTime > block.timestamp, "Transaction already expired");
        require(trx.buyer == _sender, "Only the buyer can invoke this function");

        trx.status = EscrowStatus.PAID;

        emit Paid(_escrowId, trx.seller);
    }

    /**
     * @notice Mark transaction as paid
     * @param _escrowId Id of the escrow
     * @dev Can only be executed by the buyer
     */
    function pay(uint _escrowId) external {
        _pay(msg.sender, _escrowId);
    }

    /**
     * @dev Relay function for marking a transaction as paid
     *      Can only be called by relayer address
     * @param _sender Address marking the transaction as paid
     * @param _escrowId Id of the escrow
     */
    function pay_relayed(address _sender, uint _escrowId) external {
        assert(msg.sender == relayer);
        _pay(_sender, _escrowId);
    }

    /**
     * @notice Obtain message hash to be signed for marking a transaction as paid
     * @param _escrowId Id of the escrow
     * @return message hash
     * @dev Once message is signed, pass it as _signature of pay(uint256,bytes)
     */
    function paySignHash(uint _escrowId) public view returns(bytes32){
        uint256 cid;
        assembly { 
		    cid := chainid()
		}
        return keccak256(
            abi.encodePacked(
                address(this),
                "pay(uint256)",
                _escrowId,
                cid
            )
        );
    }

    /**
     * @notice Mark transaction as paid (via signed message)
     * @param _escrowId Id of the escrow
     * @param _signature Signature of the paySignHash result.
     * @dev There's a high probability of buyers not having ether to pay for the transaction.
     *      This allows anyone to relay the transaction.
     *      TODO: consider deducting funds later on release to pay the relayer (?)
     */
    function pay(uint _escrowId, bytes calldata _signature) external {
        address sender = _recoverAddress(_getSignHash(paySignHash(_escrowId)), _signature);
        _pay(sender, _escrowId);
    }

    /**
     * @dev Release funds to buyer
     * @param _escrowId Id of the escrow
     * @param _trx EscrowTransaction with data of transaction to be released
     * @param _isDispute indicates if the release happened due to a dispute
     */
    function _release(uint _escrowId, EscrowTransaction storage _trx, bool _isDispute) internal {
        require(_trx.status != EscrowStatus.RELEASED, "Already released");
        _trx.status = EscrowStatus.RELEASED;

        if(!_isDispute){
            offerStore.refundStake(_trx.offerId);
        }

        address token = _trx.token;
        if(token == address(0)){
            (bool success, ) = _trx.destination.call.value(_trx.tokenAmount)("");
            require(success, "Transfer failed.");
        } else {
            require(_safeTransfer(ERC20Token(token), _trx.destination, _trx.tokenAmount), "Couldn't transfer funds");
        }

        _releaseFee(_trx.arbitrator, _trx.tokenAmount, token, _isDispute);

        emit Released(_escrowId, _trx.seller, _trx.buyer, _trx.destination, _isDispute);
    }

    /**
     * @notice Release escrow funds to buyer
     * @param _escrowId Id of the escrow
     * @dev Requires contract to be unpaused.
     *      Can only be executed by the seller
     *      Transaction must not be expired, or previously canceled or released
     */
    function release(uint _escrowId) external {
        EscrowStatus mStatus = transactions[_escrowId].status;
        require(transactions[_escrowId].seller == msg.sender, "Only the seller can invoke this function");
        require(mStatus == EscrowStatus.PAID || mStatus == EscrowStatus.FUNDED, "Invalid transaction status");
        require(!_isDisputed(_escrowId), "Can't release a transaction that has an arbitration process");
        _release(_escrowId, transactions[_escrowId], false);
    }

    /**
     * @dev Cancel an escrow operation
     * @param _escrowId Id of the escrow
     * @notice Requires contract to be unpaused.
     *         Can only be executed by the seller
     *         Transaction must be expired, or previously canceled or released
     */
    function cancel(uint _escrowId) external whenNotPaused {
        EscrowTransaction storage trx = transactions[_escrowId];

        EscrowStatus mStatus = trx.status;
        require(mStatus == EscrowStatus.FUNDED || mStatus == EscrowStatus.CREATED,
                "Only transactions in created or funded state can be canceled");

        require(trx.buyer == msg.sender || trx.seller == msg.sender, "Only participants can invoke this function");

        if(mStatus == EscrowStatus.FUNDED){
            if(msg.sender == trx.seller){
                require(trx.expirationTime < block.timestamp, "Can only be canceled after expiration");
            }
        }

        _cancel(_escrowId, trx, false);
    }

    // Same as cancel, but relayed by a contract so we get the sender as param
    function cancel_relayed(address _sender, uint _escrowId) external {
        assert(msg.sender == relayer);

        EscrowTransaction storage trx = transactions[_escrowId];
        EscrowStatus mStatus = trx.status;
        require(trx.buyer == _sender, "Only the buyer can invoke this function");
        require(mStatus == EscrowStatus.FUNDED || mStatus == EscrowStatus.CREATED,
                "Only transactions in created or funded state can be canceled");

         _cancel(_escrowId, trx, false);
    }

    /**
     * @dev Cancel transaction and send funds back to seller
     * @param _escrowId Id of the escrow
     * @param trx EscrowTransaction with details of transaction to be marked as canceled
     */
    function _cancel(uint _escrowId, EscrowTransaction storage trx, bool isDispute) internal {
        EscrowStatus origStatus = trx.status;

        require(trx.status != EscrowStatus.CANCELED, "Already canceled");

        trx.status = EscrowStatus.CANCELED;

        if (origStatus == EscrowStatus.FUNDED) {
            address token = trx.token;
            uint amount = trx.tokenAmount;
            if (!isDispute) {
                amount += _getValueOffMillipercent(trx.tokenAmount, feeMilliPercent);
            }

            if (token == address(0)) {
                (bool success, ) = trx.seller.call.value(amount)("");
                require(success, "Transfer failed.");
            } else {
                ERC20Token erc20token = ERC20Token(token);
                require(_safeTransfer(erc20token, trx.seller, amount), "Transfer failed");
            }
        }

        trx.status = EscrowStatus.CANCELED;

        emit Canceled(_escrowId, trx.seller, trx.buyer, isDispute);
    }


    /**
     * @notice Rates a transaction
     * @param _escrowId Id of the escrow
     * @param _rate rating of the transaction from 1 to 5
     * @dev Can only be executed by the buyer
     *      Transaction must released
     */
    function _rateTransaction(address _sender, uint _escrowId, uint _rate) internal {
        require(_rate >= 1, "Rating needs to be at least 1");
        require(_rate <= 5, "Rating needs to be at less than or equal to 5");
        EscrowTransaction storage trx = transactions[_escrowId];
        require(trx.status == EscrowStatus.RELEASED || hadDispute(_escrowId), "Transaction not completed yet");

        if (trx.buyer == _sender) {
            require(trx.sellerRating == 0, "Transaction already rated");
            emit Rating(trx.offerId, trx.seller, _escrowId, _rate, true);
            trx.sellerRating = _rate;
        } else if (trx.seller == _sender) {
            require(trx.buyerRating == 0, "Transaction already rated");
            emit Rating(trx.offerId, trx.buyer, _escrowId, _rate, false);
            trx.buyerRating = _rate;
        } else {
            revert("Only participants can invoke this function");
        }
    }

    /**
     * @notice Rates a transaction
     * @param _escrowId Id of the escrow
     * @param _rate rating of the transaction from 1 to 5
     * @dev Can only be executed by the buyer
     *      Transaction must released
     */
    function rateTransaction(uint _escrowId, uint _rate) external {
        _rateTransaction(msg.sender, _escrowId, _rate);
    }

    // Same as rateTransaction, but relayed by a contract so we get the sender as param
    function rateTransaction_relayed(address _sender, uint _escrowId, uint _rate) external {
        assert(msg.sender == relayer);
        _rateTransaction(_sender, _escrowId, _rate);

    }

    /**
     * @notice Returns basic trade informations (buyer address, seller address, token address and token amount)
     * @param _escrowId Id of the escrow
     */
    function getBasicTradeData(uint _escrowId)
      external
      view
      returns(address payable buyer, address payable seller, address token, uint tokenAmount) {
        buyer = transactions[_escrowId].buyer;
        seller = transactions[_escrowId].seller;
        tokenAmount = transactions[_escrowId].tokenAmount;
        token = transactions[_escrowId].token;

        return (buyer, seller, token, tokenAmount);
    }

    /**
     * @notice Open case as a buyer or seller for arbitration
     * @param _escrowId Id of the escrow
     * @param _motive Motive for opening the dispute
     */
    function openCase(uint _escrowId, uint8 _motive) external {
        EscrowTransaction storage trx = transactions[_escrowId];

        require(!isDisputed(_escrowId), "Case already exist");
        require(trx.buyer == msg.sender || trx.seller == msg.sender, "Only participants can invoke this function");
        require(trx.status == EscrowStatus.PAID, "Cases can only be open for paid transactions");

        _openDispute(_escrowId, msg.sender, _motive);
    }

    /**
     * @dev Open case via relayer
     * @param _sender Address initiating the relayed transaction
     * @param _escrowId Id of the escrow
     * @param _motive Motive for opening the dispute
     */
    function openCase_relayed(address _sender, uint256 _escrowId, uint8 _motive) external {
        assert(msg.sender == relayer);

        EscrowTransaction storage trx = transactions[_escrowId];

        require(!isDisputed(_escrowId), "Case already exist");
        require(trx.buyer == _sender, "Only the buyer can invoke this function");
        require(trx.status == EscrowStatus.PAID, "Cases can only be open for paid transactions");

        _openDispute(_escrowId, _sender, _motive);
    }

    /**
     * @notice Open case as a buyer or seller for arbitration via a relay account
     * @param _escrowId Id of the escrow
     * @param _motive Motive for opening the dispute
     * @param _signature Signed message result of openCaseSignHash(uint256)
     * @dev Consider opening a dispute in aragon court.
     */
    function openCase(uint _escrowId, uint8 _motive, bytes calldata _signature) external {
        EscrowTransaction storage trx = transactions[_escrowId];

        require(!isDisputed(_escrowId), "Case already exist");
        require(trx.status == EscrowStatus.PAID, "Cases can only be open for paid transactions");

        address senderAddress = _recoverAddress(_getSignHash(openCaseSignHash(_escrowId, _motive)), _signature);

        require(trx.buyer == senderAddress || trx.seller == senderAddress, "Only participants can invoke this function");

        _openDispute(_escrowId, msg.sender, _motive);
    }

    /**
     * @notice Set arbitration result in favour of the buyer or seller and transfer funds accordingly
     * @param _escrowId Id of the escrow
     * @param _releaseFunds Release funds to buyer or cancel escrow
     * @param _arbitrator Arbitrator address
     */
    function _solveDispute(uint _escrowId, bool _releaseFunds, address _arbitrator) internal {
        EscrowTransaction storage trx = transactions[_escrowId];

        require(trx.buyer != _arbitrator && trx.seller != _arbitrator, "Arbitrator cannot be part of transaction");

        if (_releaseFunds) {
            _release(_escrowId, trx, true);
        } else {
            _cancel(_escrowId, trx, true);
            _releaseFee(trx.arbitrator, trx.tokenAmount, trx.token, true);
        }
    }

    /**
     * @notice Get arbitrator
     * @param _escrowId Id of the escrow
     * @return Arbitrator address
     */
    function _getArbitrator(uint _escrowId) internal view returns(address) {
        return transactions[_escrowId].arbitrator;
    }

    /**
     * @notice Obtain message hash to be signed for opening a case
     * @param _escrowId Id of the escrow
     * @return message hash
     * @dev Once message is signed, pass it as _signature of openCase(uint256,bytes)
     */
    function openCaseSignHash(uint _escrowId, uint8 _motive) public view returns(bytes32){
        uint256 cid;
        assembly { 
		    cid := chainid()
		}
        return keccak256(
            abi.encodePacked(
                address(this),
                "openCase(uint256,uint8)",
                _escrowId,
                _motive,
                cid
            )
        );
    }

    /**
     * @dev Support for "approveAndCall". Callable only by the fee token.
     * @param _from Who approved.
     * @param _amount Amount being approved, need to be equal `getPrice()`.
     * @param _token Token being approved, need to be equal `token()`.
     * @param _data Abi encoded data with selector of `register(bytes32,address,bytes32,bytes32)`.
     */
    function receiveApproval(address _from, uint256 _amount, address _token, bytes memory _data) public {
        require(_token == address(msg.sender), "Wrong call");
        require(_data.length == 36, "Wrong data length");

        bytes4 sig;
        uint256 escrowId;

        (sig, escrowId) = _abiDecodeFundCall(_data);

        if (sig == bytes4(0xca1d209d)){ // fund(uint256)
            uint tokenAmount = transactions[escrowId].tokenAmount;
            require(_amount == tokenAmount + _getValueOffMillipercent(tokenAmount, feeMilliPercent), "Invalid amount");
            _fund(_from, escrowId);
        } else {
            revert("Wrong method selector");
        }
    }

    /**
     * @dev Decodes abi encoded data with selector for "fund".
     * @param _data Abi encoded data.
     * @return Decoded registry call.
     */
    function _abiDecodeFundCall(bytes memory _data) internal pure returns (bytes4 sig, uint256 escrowId) {
        assembly {
            sig := mload(add(_data, add(0x20, 0)))
            escrowId := mload(add(_data, 36))
        }
    }
}
