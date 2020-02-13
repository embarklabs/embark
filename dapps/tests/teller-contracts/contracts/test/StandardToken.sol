pragma solidity ^0.5.7;

import "../token/ERC20Token.sol";


/**
 * @notice Standard ERC20 token for tests
 */
contract StandardToken is ERC20Token {

    uint256 private supply;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    constructor() public { }

    /**
     * @notice send `_value` token to `_to` from `msg.sender`
     * @param _to The address of the recipient
     * @param _value The amount of token to be transferred
     * @return Whether the transfer was successful or not
     */
    function transfer(
        address _to,
        uint256 _value
    )
        external
        returns (bool success)
    {
        return transfer(msg.sender, _to, _value);
    }

    /**
     * @notice `msg.sender` approves `_spender` to spend `_value` tokens
     * @param _spender The address of the account able to transfer the tokens
     * @param _value The amount of tokens to be approved for transfer
     * @return Whether the approval was successful or not
     */
    function approve(address _spender, uint256 _value)
        external
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value The amount of token to be transferred
     * @return Whether the transfer was successful or not
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        external
        returns (bool success)
    {
        if (balances[_from] >= _value &&
            allowed[_from][msg.sender] >= _value &&
            _value > 0) {
            allowed[_from][msg.sender] -= _value;
            return transfer(_from, _to, _value);
        } else {
            return false;
        }
    }

    /**
     * @param _owner The address from which the balance will be retrieved
     * @param _spender The address of the account able to spend the tokens
     * @return The balance
     */
    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    /**
     * @param _owner The address of the account owning tokens
     * @return Amount of remaining tokens allowed to spent
     */
    function balanceOf(address _owner)
        external
        view
        returns (uint256 balance)
    {
        return balances[_owner];
    }

    /**
     * @notice return total supply of tokens
     */
    function totalSupply()
        external
        view
        returns(uint256 currentTotalSupply)
    {
        return supply;
    }

    /**
     * @notice Mints tokens for testing
     */
    function mint(
        address _to,
        uint256 _amount
    )
        public
    {
        balances[_to] += _amount;
        supply += _amount;
        emit Transfer(address(0), _to, _amount);
    }

     /**
     * @notice send `_value` token to `_to` from `_from`
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value The amount of token to be transferred
     * @return Whether the transfer was successful or not
     */
    function transfer(
        address _from,
        address _to,
        uint256 _value
    )
        internal
        returns (bool success)
    {
        if (balances[_from] >= _value && _value > 0) {
            balances[_from] -= _value;
            balances[_to] += _value;
            emit Transfer(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }


}
