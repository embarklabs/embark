title: Smart Contracts in JavaScript
layout: docs
---

In order to talk to our deployed Smart Contracts through a web application, we typically need a JavaScript equivalent that offers APIs to make this possible. Embark generates JavaScript artifacts for all Smart Contracts used by our application.

In this guide we'll take a quick look how to make use of them!

## Importing and using Smart Contracts

Embark will [automatically generate artifacts](/docs/javascript_usage.html#Embark-Artifacts) for all configured Smart Contracts in our application, making them available to an application's front-end. Allwe have to do is importing them accordingly. For example, the Smart Contract below:

```
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

Will available as JavaScript object, after artifact generation and can be imported as:

```
import { SimpleStorage } from './embarkArtifacts/contracts';
```

Notice that the exact path to the Smart Contract source is configured using the `generationDir` property in [Embark's configuration](/docs/configuration.html#generationDir).

Once imported, Smart Contract APIs can be used as needed. The code below uses Web.js syntax and might differ from your APIs, depending on what web3 connector you've installed.

```
SimpleStorage.methods.set(100).send();

SimpleStorage.methods.get().call().then(value => {
  console.log(value);
});

SimpleStorage.methods.storedData().call().then(value => {
  console.log(value);
});
```
