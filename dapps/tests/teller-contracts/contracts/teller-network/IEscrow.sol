pragma solidity >=0.5.0 <0.6.0;

contract IEscrow {

  enum EscrowStatus {CREATED, FUNDED, PAID, RELEASED, CANCELED}

  struct EscrowTransaction {
      uint256 offerId;
      address token;
      uint256 tokenAmount;
      uint256 expirationTime;
      uint256 sellerRating;
      uint256 buyerRating;
      uint256 fiatAmount;
      address payable buyer;
      address payable seller;
      address payable arbitrator;
      address payable destination;
      EscrowStatus status;
  }

  function createEscrow_relayed(
        address payable _sender,
        uint _offerId,
        uint _tokenAmount,
        uint _fiatAmount,
        address payable _destination,
        string calldata _contactData,
        string calldata _location,
        string calldata _username
    ) external returns(uint escrowId);

  function updateDestination(uint _escrowId, address payable _destination) external;

  function pay(uint _escrowId) external;

  function pay_relayed(address _sender, uint _escrowId) external;

  function cancel(uint _escrowId) external;

  function cancel_relayed(address _sender, uint _escrowId) external;

  function openCase(uint  _escrowId, uint8 _motive) external;

  function openCase_relayed(address _sender, uint256 _escrowId, uint8 _motive) external;

  function rateTransaction(uint _escrowId, uint _rate) external;

  function rateTransaction_relayed(address _sender, uint _escrowId, uint _rate) external;

  function getBasicTradeData(uint _escrowId) external view returns(address payable buyer, address payable seller, address token, uint tokenAmount);

}
