// https://github.com/nexusdev/erc20/blob/master/contracts/base.sol

pragma solidity ^0.5.0;

contract TokenStorage {

  event Transfer(address indexed from, address indexed to, uint value);
  event Approval( address indexed owner, address indexed spender, uint value);

  mapping( address => uint ) _balances;
  mapping( address => mapping( address => uint ) ) _approvals;
  uint _supply;
  address public addr;

  constructor( uint initial_balance, address _addr) public {
    _balances[msg.sender] = initial_balance;
    _supply = initial_balance;
    addr = _addr;
  }

  function totalSupply() public view returns (uint supply) {
    return _supply;
  }

  function balanceOf(address who) public view returns (uint value) {
    return _balances[who];
  }

  function transfer(address to, uint value) public returns (bool ok) {
    if( _balances[msg.sender] < value ) {
      revert();
    }
    if( !safeToAdd(_balances[to], value) ) {
      revert();
    }
    _balances[msg.sender] -= value;
    _balances[to] += value;
    emit Transfer( msg.sender, to, value );
    return true;
  }

  function transferFrom(address from, address to, uint value) public returns (bool ok) {
    // if you don't have enough balance, throw
    if( _balances[from] < value ) {
      revert();
    }
    // if you don't have approval, throw
    if( _approvals[from][msg.sender] < value ) {
      revert();
    }
    if( !safeToAdd(_balances[to], value) ) {
      revert();
    }
    // transfer and return true
    _approvals[from][msg.sender] -= value;
    _balances[from] -= value;
    _balances[to] += value;
    emit Transfer( from, to, value );
    return true;
  }

  function approve(address spender, uint value) public returns (bool ok) {
    // TODO: should increase instead
    _approvals[msg.sender][spender] = value;
    emit Approval( msg.sender, spender, value );
    return true;
  }

  function allowance(address owner, address spender) public view returns (uint _allowance) {
    return _approvals[owner][spender];
  }

  function safeToAdd(uint a, uint b) internal pure returns (bool) {
    return (a + b >= a);
  }
}
