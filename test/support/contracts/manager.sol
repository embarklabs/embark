contract Manager {
  address public data;

  function Manager(address dataAddress) {
    data = dataAddress;
  }

  function update(address _addr) {
    data = _addr;
  }
}
