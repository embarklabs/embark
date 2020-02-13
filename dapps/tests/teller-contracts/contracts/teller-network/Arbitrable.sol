/* solium-disable security/no-block-members */
pragma solidity >=0.5.0 <0.6.0;

import "./ArbitrationLicense.sol";


/**
 * Arbitrable
 * @dev Utils for management of disputes
 */
contract Arbitrable {

    enum ArbitrationResult {UNSOLVED, BUYER, SELLER}
    enum ArbitrationMotive {NONE, UNRESPONSIVE, PAYMENT_ISSUE, OTHER}


    ArbitrationLicense public arbitratorLicenses;

    mapping(uint => ArbitrationCase) public arbitrationCases;

    address public fallbackArbitrator;

    uint public arbitrationTimeout;

    struct ArbitrationCase {
        bool open;
        address openBy;
        address arbitrator;
        uint arbitratorTimeout;
        ArbitrationResult result;
        ArbitrationMotive motive;
    }

    event ArbitratorChanged(uint indexed escrowId, address sender, address indexed ogArbitrator, address indexed newArbitrator);
    event ArbitrationCanceled(uint indexed escrowId);
    event ArbitrationRequired(uint indexed escrowId, uint timeout, address indexed arbitrator);
    event ArbitrationResolved(uint indexed escrowId, ArbitrationResult result, address indexed arbitrator);

    /**
     * @param _arbitratorLicenses Address of the Arbitrator Licenses contract
     * @param _fallbackArbitrator Address of the fallback arbitrator in case the original arbitrator does not work on a dispute
     */
    constructor(address _arbitratorLicenses, address _fallbackArbitrator) public {
        arbitratorLicenses = ArbitrationLicense(_arbitratorLicenses);
        fallbackArbitrator = _fallbackArbitrator;
        arbitrationTimeout = 5 days;
    }

    /**
     * @param _escrowId Id of the escrow with an open dispute
     * @param _releaseFunds Release funds to the buyer
     * @param _arbitrator Address of the arbitrator solving the dispute
     * @dev Abstract contract used to perform actions after a dispute has been settled
     */
    function _solveDispute(uint _escrowId, bool _releaseFunds, address _arbitrator) internal;

    /**
     * @notice Get arbitrator of an escrow
     * @return address Arbitrator address
     */
    function _getArbitrator(uint _escrowId) internal view returns(address);

    /**
     * @notice Determine if a dispute exists/existed for an escrow
     * @param _escrowId Escrow to verify
     * @return bool result
     */
    function isDisputed(uint _escrowId) public view returns (bool) {
        return _isDisputed(_escrowId);
    }

    function _isDisputed(uint _escrowId) internal view returns (bool) {
        return arbitrationCases[_escrowId].open || arbitrationCases[_escrowId].result != ArbitrationResult.UNSOLVED;
    }

    /**
     * @notice Determine if a dispute existed for an escrow
     * @param _escrowId Escrow to verify
     * @return bool result
     */
    function hadDispute(uint _escrowId) public view returns (bool) {
        return arbitrationCases[_escrowId].result != ArbitrationResult.UNSOLVED;
    }

    /**
     * @notice Cancel arbitration
     * @param _escrowId Escrow to cancel
     */
    function cancelArbitration(uint _escrowId) external {
        require(arbitrationCases[_escrowId].openBy == msg.sender, "Arbitration can only be canceled by the opener");
        require(arbitrationCases[_escrowId].result == ArbitrationResult.UNSOLVED && arbitrationCases[_escrowId].open, 
            "Arbitration already solved or not open");

        delete arbitrationCases[_escrowId];

        emit ArbitrationCanceled(_escrowId);
    }

    /**
     * @notice Opens a dispute between a seller and a buyer
     * @param _escrowId Id of the Escrow that is being disputed
     * @param _openBy Address of the person opening the dispute (buyer or seller)
     * @param _motive Description of the problem
     */
    function _openDispute(uint _escrowId, address _openBy, uint8 _motive) internal {
        require(arbitrationCases[_escrowId].result == ArbitrationResult.UNSOLVED && !arbitrationCases[_escrowId].open,
                "Arbitration already solved or has been opened before");

        address arbitratorAddress = _getArbitrator(_escrowId);

        require(arbitratorAddress != address(0), "Arbitrator is required");

        uint timeout = block.timestamp + arbitrationTimeout;

        arbitrationCases[_escrowId] = ArbitrationCase({
            open: true,
            openBy: _openBy,
            arbitrator: arbitratorAddress,
            arbitratorTimeout: timeout,
            result: ArbitrationResult.UNSOLVED,
            motive: ArbitrationMotive(_motive)
        });

        emit ArbitrationRequired(_escrowId, timeout, arbitratorAddress);
    }

    /**
     * @notice Allow participants to escalate dispute to fallback arbitrator after timeout
     * @param _escrowId Id of the Escrow that is being disputed
     */
    function escalateDispute(uint _escrowId) external {
        require(arbitrationCases[_escrowId].open && arbitrationCases[_escrowId].result == ArbitrationResult.UNSOLVED, "Case must be open and unsolved");
        require(block.timestamp > arbitrationCases[_escrowId].arbitratorTimeout, "Arbitration is still active");

        emit ArbitratorChanged(_escrowId, msg.sender, arbitrationCases[_escrowId].arbitrator, fallbackArbitrator);
        arbitrationCases[_escrowId].arbitrator = fallbackArbitrator;
    }

    /**
     * @notice Set arbitration result in favour of the buyer or seller and transfer funds accordingly
     * @param _escrowId Id of the escrow
     * @param _result Result of the arbitration
     */
    function setArbitrationResult(uint _escrowId, ArbitrationResult _result) external {
        require(arbitrationCases[_escrowId].open && arbitrationCases[_escrowId].result == ArbitrationResult.UNSOLVED,
                "Case must be open and unsolved");
        require(_result != ArbitrationResult.UNSOLVED, "Arbitration does not have result");

        if (msg.sender == fallbackArbitrator) {
            require(block.timestamp > arbitrationCases[_escrowId].arbitratorTimeout, "Arbitration is still active");
            if (arbitrationCases[_escrowId].arbitrator != msg.sender) {
                emit ArbitratorChanged(_escrowId, msg.sender, arbitrationCases[_escrowId].arbitrator, msg.sender);
                arbitrationCases[_escrowId].arbitrator = msg.sender;
            }
        } else {
            require(arbitratorLicenses.isLicenseOwner(msg.sender), "Only arbitrators can invoke this function");
            require(arbitrationCases[_escrowId].arbitrator == msg.sender, "Invalid escrow arbitrator");
        }

        arbitrationCases[_escrowId].open = false;
        arbitrationCases[_escrowId].result = _result;

        emit ArbitrationResolved(_escrowId, _result, msg.sender);

        if (_result == ArbitrationResult.BUYER) {
            _solveDispute(_escrowId, true, msg.sender);
        } else {
            _solveDispute(_escrowId, false, msg.sender);
        }
    }
}
