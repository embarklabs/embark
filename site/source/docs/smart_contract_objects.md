title: Smart Contract Objects
layout: docs
---
### Interacting with contracts in Javascript

Embark will automatically take care of deployment for you and set all needed JS bindings. For example, the contract below:

```
// app/contracts/simple_storage.sol

contract SimpleStorage {
  uint public storedData;

  function SimpleStorage(uint initialValue) {
    storedData = initialValue;
  }

  function set(uint x) {
    storedData = x;
  }
  function get() constant returns (uint retVal) {
    return storedData;
  }
}
```

Will automatically be available in Javascript as:

```
// app/js/index.js

import SimpleStorage from 'Embark/contracts/SimpleStorage';

SimpleStorage.methods.set(100).send();
SimpleStorage.methods.get().call().then(function(value) { console.log(value) });
SimpleStorage.methods.storedData().call().then(function(value) { console.log(value) });
```

The syntax used is <a href="https://web3js.readthedocs.io/en/v1.2.6/" target="_blank">web3.js 1.2.6</a>
