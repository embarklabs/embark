contract SimpleStorage {
  uint public storedData;

  function SimpleStorage(uint initialValue) {
    storedData2 = initialValue;
  }

  function set(uint x) {
    storedData = x;
  }
  function get() constant returns (uint retVal) {
    return storedData;
  }
}
