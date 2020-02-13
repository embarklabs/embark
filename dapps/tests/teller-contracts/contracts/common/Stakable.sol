/* solium-disable security/no-call-value */

pragma solidity >=0.5.0 <0.6.0;

import "../common/Ownable.sol";
import "../token/ERC20Token.sol";
import "../token/SafeTransfer.sol";


contract Stakable is Ownable, SafeTransfer {
    address payable public burnAddress;

    struct Stake {
        uint amount;
        address payable owner;
        address token;
    }

    mapping(uint => Stake) public stakes;
    mapping(address => uint) public stakeCounter;

    event BurnAddressChanged(address sender, address prevBurnAddress, address newBurnAddress);

    event Staked(uint indexed itemId, address indexed owner, uint amount);
    event Unstaked(uint indexed itemId, address indexed owner, uint amount);
    event Slashed(uint indexed itemId, address indexed owner, address indexed slasher, uint amount);

    /**
     * @param _burnAddress Address where the slashed stakes are going to be sent
     */
    constructor(address payable _burnAddress) internal {
        burnAddress = _burnAddress;
    }

    /**
     * @dev Changes the burn address
     * @param _burnAddress New burn address
     */
    function setBurnAddress(address payable _burnAddress) external onlyOwner {
        emit BurnAddressChanged(msg.sender, burnAddress, _burnAddress);
        burnAddress = _burnAddress;
    }

    /**
     * @notice Get amount to stake for the next offer
     * @param _owner Address for which the stake amount will be calculated
     * @return Amount to stake in wei
     */
    function getAmountToStake(address _owner) public view returns(uint);

    /**
     * @dev Stake eth amount for an item
     * @param _itemId Identifier of the item that will have a stake
     * @param _owner Owner of the stake
     * @param _tokenAddress Asset used for the stake (ignored in this version)
     */
    function _stake(uint _itemId, address payable _owner, address _tokenAddress) internal {
        require(stakes[_itemId].owner == address(0), "Already has/had a stake");

        uint stakeAmount = getAmountToStake(_owner);
        require(msg.value >= stakeAmount, "More ETH is required");

        stakeCounter[_owner]++;
        // Using only ETH as stake for phase 0
        address tokenAddress = address(0);


        stakes[_itemId].amount = msg.value;
        stakes[_itemId].owner = _owner;
        stakes[_itemId].token = tokenAddress;

        emit Staked(_itemId,  _owner, stakeAmount);
    }

    /**
     * @dev Remove stake from item
     * @param _itemId Identifier of the item that has a stake
     */
    function _unstake(uint _itemId) internal {
        Stake storage s = stakes[_itemId];

        if (s.amount == 0) {
            return; // No stake for item
        }

        uint amount = s.amount;
        s.amount = 0;

        assert(stakeCounter[s.owner] > 0);
        stakeCounter[s.owner]--;

        if (s.token == address(0)) {
            (bool success, ) = s.owner.call.value(amount)("");
            require(success, "Transfer failed.");
        } else {
            require(_safeTransfer(ERC20Token(s.token), s.owner, amount), "Couldn't transfer funds");
        }

        emit Unstaked(_itemId, s.owner, amount);
    }

    /**
     * @dev Slash a stake, sending the funds to the burn address
     * @param _itemId Identifier of the item that has a stake
     */
    function _slash(uint _itemId) internal {
        Stake storage s = stakes[_itemId];

        if (s.amount == 0) {
            return;
        }

        uint amount = s.amount;
        s.amount = 0;

        if (s.token == address(0)) {
            (bool success, ) = burnAddress.call.value(amount)("");
            require(success, "Transfer failed.");
        } else {
            require(_safeTransfer(ERC20Token(s.token), burnAddress, amount), "Couldn't transfer funds");
        }

        emit Slashed(
            _itemId,
            s.owner,
            msg.sender,
            amount
        );
    }

    /**
     * @dev Refund stake funds to its owner
     * @param _itemId Identifier of the item that has a stake
     */
    function _refundStake(uint _itemId) internal {
        Stake storage s = stakes[_itemId];

        if (s.amount == 0) {
            return;
        }

        uint amount = s.amount;
        s.amount = 0;

        stakeCounter[s.owner]--;

        if (amount != 0) {
            if (s.token == address(0)) {
                (bool success, ) = s.owner.call.value(amount)("");
                require(success, "Transfer failed.");
            } else {
                require(_safeTransfer(ERC20Token(s.token), s.owner, amount), "Couldn't transfer funds");
            }
        }
    }

}