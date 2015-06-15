contract SimpleStorage {
  uint public foo;

  function SimpleStorage(uint y) {
    foo = y;
  }

  uint storedData;
  function set(uint x) {
    storedData = x;
  }
  function get() constant returns (uint retVal) {
    return storedData;
  }
}
