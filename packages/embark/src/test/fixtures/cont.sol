pragma solidity ^0.5.0;
contract x {
  int number;
  string name;

  constructor(string _name)
  public
  {
    name = _name;
  }

  function g(int _number)
  public
  returns (int _multiplication)
  {
    number = _number;
    return _number * 5;
  }

  function f(int _foo, int _bar)
  public
  pure
  returns (int _addition)
  {
    return _foo + _bar;
  }

  function h(int _bar)
  public
  pure
  returns (bool _great)
  {
    if(_bar > 25) {
      return true;
    } else {
      return false;
    }
  }
}
