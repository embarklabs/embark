title: Testing Smart Contracts
layout: docs
---

Testing is a crucial part of developing robust and high-quality software. That's why Embark aims to make testing our Smart Contract as easy as possible. In this guide we'll explore Embark specific testing APIs and how to write tests for our Smart Contracts.

## Creating tests

Test files resides in a project's `test` folder. Any JavaScript file within `test/` is considered a spec file and will be executed by Embark as such. A spec file contains test specs which are grouped in `contract()` functions. A single spec is written using `it()` blocks. 

Here's what such a test could look like:

```
contract('SomeContract', () => {
  it('should pass', () => {
    assert.ok(true);
  });
});
```

This is a single test spec which will always pass. We're using a globally available `assert` object to make assertions in our specs. If you're familiar with the [Mocha testing framework](https://mochajs.org), this syntax might be familiar. In fact, Embark uses Mocha as a test runner behind the scenes.

`contract()` is just an alias for Mocha's `describe()` function and is globally available. In general, global functions and objects are:

- `contract()`: Same as Mocha's `describe`
- `config()`: Function to deploy Smart Contracts using custom configurations.
- `web3`: Web3 object
- `assert`: Node's assert
- Mocha functions: `describe()`, `it()`, `before()`, etc.

### Importing EmbarkJS

If we want to use any of EmbarkJS' APIs, we can require it as expected:

```
const EmbarkJS = require('Embark/EmbarkJS');
```

For more information on EmbarkJS's APIs, head over to [this guide](/docs/javascript_usage.html).

## Running tests

Once we've written our tests, we can execute them using Embark's `test` command:

```
$ embark test
```

As mentioned earlier, this will pick up all files inside the `test/` folder and run them as test files.

### Running test subsets

If we aren't interested in running all tests but only a specific subset, we can specify a test file as part of the `test` command like this:

```
$ embark test test/SomeContract_spec.js
```

### Running tests against a different node

By default, tests are run using an Ethereum simulator ([Ganache](https://www.truffleframework.com/ganache)). We can use the `--node` option to change that behavior. Passing `--node embark` to `embark test` will use the Ethereum node associated with an already running embark process. We can also specify a custom endpoint, for example:

```
$ embark test --node ws://localhost:8556
```

### Outputting gas cost details

When running tests, we can even get an idea of what the gas costs of our Smart Contract deployments are. Embark comes with a `--gasDetails` option that makes this possible.

```
$ embark test --gasDetails
```

## Configuring Smart Contracts for tests

Very similar to how we [configure our Smart Contracts](/docs/contracts_configuration.html) for deployment on test or production nets, we have to configure them for our tests as well. This is important, so that our Smart Contracts get deployed with the correct testing data.

To do that, Embark adds a global `config()` function to the execution context, which uses the same API as the configuration object for our application's Smart Contracts. So if we had a `SomeContract` that should be picked up for deployment, this is what the configuration would look like:

```
config({
  contracts: {
    SomeContract: {} // options as discussed in Smart Contract configuration guide
  }
});

contract('SomContract', () => {
  ...
});
```

One thing that's important to note here is that, behind the scenes, Embark has to run `config()` first to deploy the Smart Contracts and only **then** starts running tests. This will have an impact on the developer experience when importing Smart Contract instances within spec files. But more on that later.

{% notification info 'A note on config()' %}
The global `config()` function is used for Smart Contract deployment and therefore delays the execution of tests until deployment is done.
{% endnotification %}

## Accessing Smart Contract instances

To write meaningful tests, we obviously want to interact with our Smart Contracts. As we know, [Embark generates Smart Contract instances](/docs/javascript_usage.html#Embark-Artifacts) for us. All we have to do is importing and using them accordingly.

The following code imports `SomeContract` and calls an imaginary method on it inside a spec:

```
const SomeContract = require('EmbarkJS/contracts/SomeContract');

config({
  contracts: {
    SomeContract: {}
  }
});

contract('SomeContract', () => {

  it('should do something', async () => {
    const result = await SomeContract.methods.doSomething.call();
    assert.equal(result, 'foo');
  });
});
```

There's one gotcha to keep in mind though. Looking at the snippet above, it seems like we can use `SmartContract` right away once it is imported. However, this is not actually true. As mentioned earlier, Embark first has to actually deploy our Smart Contracts and until that happens, all imported Smart Contract references are empty objects.

This is not a problem anymore when using Smart Contract instances inside spec blocks, because we know that tests are executed after all Smart Contracts have been deployed. Embark will hydrate the imported references with actual data before the tests are run.

{% notification info 'Smart Contract reference hydration' %}
Smart Contract references imported from EmbarkJS are empty until the Smart Contract are actually deployed. This means Smart Contract references can only be used inside `contract()` blocks.
{% endnotification %}

## Configuring accounts

Accounts within the testing environment can be configured [just like we're used to](/docs/contracts_deployment.html). The same rules apply here, and [configuring an Ether balance](/docs/contracts_deployment.html#Configuring-account-balance-for-development) is supported as well. Configuring custom accounts in tests is especially useful if we want to use a specific account for our tests. 

```
config({
  deployment: {
    accounts: [
      {
        privateKeyFile: 'path/to/file',
        balance: '42 shannon'
      }
    ]
  }
});
```

## Accessing Accounts

Obviously, we want to access all configured accounts as well. Sometimes we want to test functions or methods that require us to specify a `from` address to send transactions from. For those cases we very likely want to access any of our our available accounts.

All available accounts are emitted by `config()` and can be accessed using a callback parameter like this:

```
let accounts = [];

config({
  ...
}, (err, accounts) => {
  accounts = accounts;
});
```

Notice that we're introducing a global `accounts` variable so we can mutate its state once the accounts are loaded. This is necessary to make the emitted accounts available in any of our spec blocks.

## Connecting to a different node

By default, Embark will use an internal VM to run the tests. However we can also specify a node to connect to and run the tests there, using the `host`, `port` and `type` options as shown below:

```
config({
  deployment: {
    "host": "localhost",
    "port": 8545,
    "type": "rpc"
  }
});
```

## Manually deploying Smart Contracts

As mentioned earlier, Embark handles the deployment of our Smart Contracts using  the function `config()` function. If we wish to deploy particular Smart Contracts manually, we can do so using an imported Smart Contract reference. We just need to make sure that we're doing this inside a `contract()` block as discussed earlier:

```
const SimpleStorage = require('Embark/contracts/SimpleStorage');

contract('SimpleStorage Deploy', () => {
  let SimpleStorageInstance;

  before(async function() {
    SimpleStorageInstance = await SimpleStorage.deploy({ arguments: [150] }).send();
  });

  it('should set constructor value', async () => {
    let result = await SimpleStorageInstance.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });
});
```

## Code coverage

Embark allows you to generate a coverage report for your Solidity Smart Contracts by passing the `--coverage` option on the `embark test` command.

```
$ embark test --coverage
```

The generated report looks something like this:

![Coverage Report: Files](/coverage-files.png)

This gives us a birds-eye view on the state of the coverage of our Smart Contracts: how many of the functions were called, how many lines were hit, even whether all the branch cases were executed. When selecting a file, a more detailed report is produced. Here's what it looks like:

![Coverage Report: Detailed](/coverage-report.png)
