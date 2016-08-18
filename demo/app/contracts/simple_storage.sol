contract SimpleStorage {
  uint public storedData;

  function SimpleStorage(uint initialValue) {
    storedData = initialValue;
  }

  function set(uint x) {
    //for (uint same3=0; same3 < 3; same3++) {
    //  storedData = same3;
    //}
    storedData = x;
  }

  function get() constant returns (uint retVal) {
    return storedData;
  }

}
