pragma solidity ^0.4.18;

/**
 * @title Deed to hold ether in exchange for ownership of a node
 * @dev The deed can be controlled only by the registrar and can only send ether back to the owner.
 */
contract Deed {

    address constant burn = 0xdead;

    address public registrar;
    address public owner;
    address public previousOwner;

    uint public creationDate;
    uint public value;

    bool active;

    event OwnerChanged(address newOwner);
    event DeedClosed();

    modifier onlyRegistrar {
        require(msg.sender == registrar);
        _;
    }

    modifier onlyActive {
        require(active);
        _;
    }

    function Deed(address _owner) public payable {
        owner = _owner;
        registrar = msg.sender;
        creationDate = now;
        active = true;
        value = msg.value;
    }

    function setOwner(address newOwner) public onlyRegistrar {
        require(newOwner != 0);
        previousOwner = owner;  // This allows contracts to check who sent them the ownership
        owner = newOwner;
        OwnerChanged(newOwner);
    }

    function setRegistrar(address newRegistrar) public onlyRegistrar {
        registrar = newRegistrar;
    }

    function setBalance(uint newValue, bool throwOnFailure) public onlyRegistrar onlyActive {
        // Check if it has enough balance to set the value
        require(value >= newValue);
        value = newValue;
        // Send the difference to the owner
        require(owner.send(this.balance - newValue) || !throwOnFailure);
    }

    /**
     * @dev Close a deed and refund a specified fraction of the bid value
     *
     * @param refundRatio The amount*1/1000 to refund
     */
    function closeDeed(uint refundRatio) public onlyRegistrar onlyActive {
        active = false;
        require(burn.send(((1000 - refundRatio) * this.balance)/1000));
        DeedClosed();
        destroyDeed();
    }

    /**
     * @dev Close a deed and refund a specified fraction of the bid value
     */
    function destroyDeed() public {
        require(!active);

        // Instead of selfdestruct(owner), invoke owner fallback function to allow
        // owner to log an event if desired; but owner should also be aware that
        // its fallback function can also be invoked by setBalance
        if (owner.send(this.balance)) {
            selfdestruct(burn);
        }
    }
}
