What is embark
======

[![Join the chat at https://gitter.im/iurimatias/embark-framework](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/iurimatias/embark-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Embark is a framework that allows you to easily develop and deploy DApps.

With Embark you can:
* Automatically deploy contracts and make them available in your JS code. Embark watches for changes, and if you update a contract, Embark will automatically redeploy the contracts (if needed) and the dapp.
* Use any build pipeline or tool you wish, including grunt and meteor.
* Do Test Driven Development with Contracts using Javascript.
* Easily deploy to & use decentralized systems such as IPFS.
* Keep track of deployed contracts, deploy only when truly needed.
* Manage different chains (e.g testnet, private net, livenet)
* Quickly create advanced DApps using multiple contracts.

See the [Wiki](https://github.com/iurimatias/embark-framework/wiki) for more details.

Installation
======
Requirements: geth (1.4.4 or higher), node (5.0.0) and npm
Optional: serpent (develop) if using contracts with Serpent, ethersim if using the simulator or the test functionality

```Bash
$ npm -g install embark-framework
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

note: for a demo using meteor do ```embark meteor_demo``` followed by ```embark deploy``` then ```meteor```

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
    |___ blockchain.yml #environments configuration
    |___ contracts.yml  #contracts configuration
    |___ server.yml     #server configuration
  spec/
    |___ contracts/ #contracts tests
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

```Yaml
# config/contracts.yml
  development:
    SimpleStorage:
      gas_limit: 500000
      gas_price: 10000000000000
      args:
        - 100
  ...
```

If you are using multiple contracts, you can pass a reference to another contract as ```$ContractName```, Embark will automatically replace this with the correct address for the contract.


```Yaml
# config/contracts.yml
  development:
    SimpleStorage:
      args:
        - 100
        - $MyStorage
    MyStorage:
       args:
         - "initial string"
    MyMainContract:
      args:
        - $SimpleStorage
  ...
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

Tests
======

You can run specs with ```embark spec```, it will run any test files under ```test/```.

Embark includes a testing lib to fastly run & test your contracts in a EVM.

```Javascript
# test/simple_storage_spec.js
var assert = require('assert');
var Embark = require('embark-framework');
var EmbarkSpec = Embark.initTests();

describe("SimpleStorage", function(done) {
  before(function(done) {
    EmbarkSpec.deployAll(done);
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

})
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
If you want to deploy to the live net then after configuring you account on ```config/blockchain.yml``` on the ```production``` environment then you can deploy to that chain by specifying the environment ```embark ipfs production```.

LiveReload Plugin
======

Embark works quite well with the LiveReload Plugin

Debugging embark
======
Because embark is internally using grunt tasks, debugging is not straightforward. Example

- you want to debug `embark deploy`
- normally you would write something like `node-debug -p 7000 embark -- deploy`
- This gives you nothing with embark. If you look at `deploy` command in [`./bin/embark`](https://github.com/iurimatias/embark-framework/blob/develop/bin/embark#L32-L35) you will notice that it internally runs grunt task `grunt deploy_contracts:[env]`
- with this knowledge we can prepare proper command to start debugging
- ```node-debug -p 7000 grunt -- deploy_contracts:development```


[here](https://github.com/iurimatias/embark-framework/blob/develop/tasks/tasks.coffee) is list of all debuggable grunt tasks

EACCESS Error
======
If you get EACCES (access denied) errors, don't use sudo, try this:

```Bash
$ mkdir ~/npm-global
$ npm config set prefix ~/npm-global
$ echo 'export PATH="$PATH:$HOME/npm-global/bin"' >>~/.bashrc
$ source ~/.bashrc
$ npm install -g embark-framework grunt-cli
```
