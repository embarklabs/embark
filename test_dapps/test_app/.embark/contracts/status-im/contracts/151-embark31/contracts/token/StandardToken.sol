pragma solidity ^0.4.24;

import "/Users/iurimatias/Projects/Status/embark/test_dapps/test_app/.embark/contracts/status-im/contracts/151-embark31/contracts/token/ERC20Token.sol";

contract StandardToken is ERC20Token {

    uint256 private supply;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    constructor() internal { }

    function transfer(
        address _to,
        uint256 _value
    )
        external
        returns (bool success)
    {
        return transfer(msg.sender, _to, _value);
    }

    function approve(
        address _to,
        uint256 _value
    )
        external
        returns (bool success)
    {
        return approve(msg.sender, _to, _value);
    }

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

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    function balanceOf(address _owner)
        external
        view
        returns (uint256 balance)
    {
        return balances[_owner];
    }

    function totalSupply()
        external
        view
        returns(uint256 currentTotalSupply)
    {
        return supply;
    }
    
    /**
     * @dev Aprove the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * @param _from The address that is approving the spend
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _from, address _spender, uint256 _value) internal returns (bool) {

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require((_value == 0) || (allowed[_from][_spender] == 0), "Bad usage");

        allowed[_from][_spender] = _value;
        emit Approval(_from, _spender, _value);
        return true;
    }

    function mint(
        address _to,
        uint256 _amount
    )
        internal
    {
        balances[_to] += _amount;
        supply += _amount;
        emit Transfer(0x0, _to, _amount);
    }

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
            if(_to == address(0)) {
                supply -= _value;
            } else {
                balances[_to] += _value;
            }
            emit Transfer(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }


}
