note: This readme refers to version 1.2.0 of Embark. Not version 2.0 which will be released soon(ish).

What is embark
======

[![Join the chat at https://gitter.im/iurimatias/embark-framework](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/iurimatias/embark-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Embark is a framework that allows you to easily develop and deploy  DApps.

With Embark you can:
* Automatically deploy contracts and make them available in your JS code. Embark watches for changes, and if you update a contract, Embark will automatically redeploy the contracts (if needed) and the dapp.
* Use any build pipeline or tool you wish, including grunt and meteor. (for 1.x, plugins coming soon for 2.x series) 
* Do Test Driven Development with Contracts using Javascript.
* Easily deploy to & use decentralized systems such as IPFS.
* Keep track of deployed contracts, deploy only when truly needed.
* Manage different chains (e.g testnet, private net, livenet)
* Quickly create advanced DApps using multiple contracts that can interact with decentralized infrastructure for storage and comunication. 

Installation
======
Requirements: geth (1.4.4 or higher), node (5.0.0) and npm
Optional: serpent (develop) if using contracts with Serpent, testrpc or ethersim if using the simulator or the test functionality

```Bash
$ npm -g install embark

# If you plan to use the simulator instead of a real ethereum node.
$ npm -g install testrpc
```

See [Complete Installation Instructions](https://github.com/iurimatias/embark-framework/wiki/Installation).

Usage - Demo
======
You can easily create a sample working DApp with the following:

```Bash
$ embark demo
$ cd embark_demo
```

To run a ethereum rpc simulator simply run:

```Bash
$ embark simulator
```

Or Alternatively, you can run a REAL ethereum node for development purposes:

```Bash
$ embark blockchain
```

By default embark blockchain will mine a minimum amount of ether and will only mine when new transactions come in. This is quite usefull to keep a low CPU. The option can be configured at config/blockchain.yml

Then, in another command line:

```Bash
$ embark run
```
This will automatically deploy the contracts, update their JS bindings and deploy your DApp to a local server at http://localhost:8000

Note that if you update your code it will automatically be re-deployed, contracts included. There is no need to restart embark, refreshing the page on the browser will do.

Creating a new DApp
======

```Bash
$ embark new AppName
$ cd AppName
```

DApp Structure
======

```Bash
  app/
    |___ contracts/ #solidity or serpent contracts
    |___ html/
    |___ css/
    |___ js/
  config/
    |___ blockchain.json #environments configuration
    |___ contracts.json  #contracts configuration
  test/
    |___ #contracts tests
```

Solidity/Serpent files in the contracts directory will automatically be deployed with embark run. Changes in any files will automatically be reflected in app, changes to contracts will result in a redeployment and update of their JS Bindings

Using Contracts
======
Embark will automatically take care of deployment for you and set all needed JS bindings. For example, the contract below:

```Javascript
# app/contracts/simple_storage.sol
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

```Javascript
# app/js/index.js
SimpleStorage.set(100);
SimpleStorage.get();
SimpleStorage.storedData();
```

You can specify for each contract and environment its gas costs and arguments:

```Json
# config/contracts.json
{
  "development": {
    "gas": "auto",
    "contracts": {
      "SimpleStorage": {
        "args": [
          100
        ]
      }
    }
  }
}
```

If you are using multiple contracts, you can pass a reference to another contract as ```$ContractName```, Embark will automatically replace this with the correct address for the contract.


```Yaml
# config/contracts.json
{
  ...
  "development": {
    "contracts": {
      "SimpleStorage": {
        "args": [
          100,
          $MyStorage
        ]
      },
      "MyStorage": {
        "args": [
          "initial string"
        ]
      },
      "MyMainContract": {
        "args": [
          $SimpleStorage
        ]
      }
    }
  }
  ...
}
```

You can now deploy many instances of the same contract. e.g


```Yaml
# config/contracts.yml
  development:
    Currency:
      deploy: false
      args:
        - 100
    Usd:
      instanceOf: Currency
      args:
        - "initial string"
    MyCoin:
      instanceOf: Currency
      args:
        - $SimpleStorage
  ...
```

Contracts addresses can be defined, If an address is defined the contract wouldn't be deployed but its defined address will be used instead.


```Yaml
  development:
    UserStorage:
      address: 0x123456
    UserManagement:
       args:
         - $UserStorage
  ...
```

You can also define contract interfaces (Stubs) and actions to do on deployment

```Yaml
  development:
    DataSource:
      args:
    MyDataSource:
      args:
      instanceOf: DataSource
    Manager:
      stubs:
        - DataSource
      args:
        - $MyDataSource
      onDeploy:
        - Manager.updateStorage($MyDataSource)
        - MyDataSource.set(5)
  ...
```

EmbarkJS
======

EmbarkJS - Storage
======

EmbarkJS - Communication
======

Tests
======

You can run specs with ```embark test```, it will run any test files under ```test/```.

Embark includes a testing lib to fastly run & test your contracts in a EVM.

```Javascript
# test/simple_storage_spec.js

var assert = require('assert');
var Embark = require('embark-framework');
var EmbarkSpec = Embark.initTests();
var web3 = EmbarkSpec.web3;

describe("SimpleStorage", function() {
  before(function(done) {
    var contractsConfig = {
      "SimpleStorage": {
        args: [100]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, done);
  });

  it("should set constructor value", function(done) {
    SimpleStorage.storedData(function(err, result) {
      assert.equal(result.toNumber(), 100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.set(150, function() {
      SimpleStorage.get(function(err, result) {
        assert.equal(result.toNumber(), 150);
        done();
      });
    });
  });

});
```

Embark uses [Mocha](http://mochajs.org/) by default, but you can use any testing framework you want.

Working with different chains
======
You can specify which environment to deploy to:


```$ embark blockchain staging```

```$ embark run staging```

The environment is a specific blockchain configuration that can be managed at config/blockchain.yml

```Yaml
# config/blockchain.yml
  ...
  staging:
    rpc_host: localhost
    rpc_port: 8101
    rpc_whitelist: "*"
    datadir: default
    chains: chains_staging.json
    network_id: 0
    console: true
    geth_extra_opts: --vmdebug
    account:
      init: false
      address: 0x123
```

See [Configuration](https://github.com/iurimatias/embark-framework/wiki/Configuration).

Deploying only contracts
======
Although embark run will automatically deploy contracts, you can choose to only deploy the contracts to a specific environment

```Bash
$ embark deploy privatenet
```

embark deploy will deploy all contracts at app/contracts and return the resulting addresses

Structuring Application
======

Embark is quite flexible and you can configure you're own directory structure using ```embark.yml```

```Yaml
# embark.yml
  type: "manual" #other options: meteor, grunt
  contracts: ["app/contracts/**/*.sol", "app/contracts/**/*.se"] # contracts files
  output: "src/embark.js" # resulting javascript interface
  blockchainConfig: "config/blockchain.yml" # blockchain config
  contractsConfig: "config/contracts.yml" # contracts config
```

Deploying to IPFS
======

To deploy a dapp to IPFS, all you need to do is run a local IPFS node and then run ```embark ipfs```.
If you want to deploy to the livenet then after configuring you account on ```config/blockchain.json``` on the ```production``` environment then you can deploy to that chain by specifying the environment ```embark ipfs production```.

LiveReload Plugin
======

Embark works quite well with the LiveReload Plugin
