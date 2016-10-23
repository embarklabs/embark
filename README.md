
[![Join the chat at https://gitter.im/iurimatias/embark-framework](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/iurimatias/embark-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build
Status](https://travis-ci.org/iurimatias/embark-framework.svg?branch=develop)](https://travis-ci.org/iurimatias/embark-framework)
[![Code Climate](https://codeclimate.com/github/iurimatias/embark-framework/badges/gpa.svg)](https://codeclimate.com/github/iurimatias/embark-framework)

What is Embark
======

Embark is a framework that allows you to easily develop and deploy  DApps.

With Embark you can:
* Automatically deploy contracts and make them available in your JS code. Embark watches for changes, and if you update a contract, Embark will automatically redeploy the contracts (if needed) and the dapp.
* Use any build pipeline or tool you wish, including grunt and meteor. (for 1.x, plugins coming soon for 2.x series) 
* Do Test Driven Development with Contracts using Javascript.
* Easily deploy to & use decentralized systems such as IPFS.
* Keep track of deployed contracts, deploy only when truly needed.
* Manage different chains (e.g testnet, private net, livenet)
* Quickly create advanced DApps using multiple contracts that can interact with decentralized infrastructure for storage and comunication. 

Table of Contents
======
* [Installation](#installation)
* [Usage Demo](#usage---demo)
* [Dashboard](#dashboard)
* [Creating a new DApp](#creating-a-new-dapp)
* [Using and Configuring Contracts](#dapp-structure)
* [EmbarkJS](#embarkjs)
* [EmbarkJS - Storage (IPFS)](#embarkjs---storage)
* [EmbarkJS - Communication (Whisper)](#embarkjs---communication)
* [Testing Contracts](#tests)
* [Working with different chains](#working-with-different-chains)
* [Custom Application Structure](#structuring-application)
* [Deploying to IPFS](#deploying-to-ipfs)
* [LiveReload Plugin](#livereload-plugin)
* [Donations](#donations)

Installation
======
Requirements: geth (1.4.4 or higher), node (5.0.0) and npm
Optional: serpent (develop) if using contracts with Serpent, testrpc or ethersim if using the simulator or the test functionality.
Further: depending on the dapp stack you choose: [IPFS](https://ipfs.io/)

```Bash
$ npm -g install embark

# If you plan to use the simulator instead of a real ethereum node.
$ npm -g install ethereumjs-testrpc
```

See [Complete Installation Instructions](https://github.com/iurimatias/embark-framework/wiki/Installation).


**updating from embark 1**

Embark's npm package has changed from ```embark-framework``` to ```embark```, this sometimes can create conflicts. To update first uninstall embark-framework 1 to avoid any conflicts. ```npm uninstall -g embark-framework``` then ```npm install -g embark```

Usage - Demo
======
You can easily create a sample working DApp with the following:

```Bash
$ embark demo
$ cd embark_demo
```

You can run a REAL ethereum node for development purposes:

```Bash
$ embark blockchain
```

Alternatively, to use an ethereum rpc simulator simply run:

```Bash
$ embark simulator
```

By default embark blockchain will mine a minimum amount of ether and will only mine when new transactions come in. This is quite usefull to keep a low CPU. The option can be configured at config/blockchain.json

Then, in another command line:

```Bash
$ embark run
```
This will automatically deploy the contracts, update their JS bindings and deploy your DApp to a local server at http://localhost:8000

Note that if you update your code it will automatically be re-deployed, contracts included. There is no need to restart embark, refreshing the page on the browser will do.

Dashboard
=====

Embark 2 comes with a terminal dashboard.

![Dashboard](http://i.imgur.com/s4OQZpu.jpg)

The dashboard will tell you the state of your contracts, the enviroment you are using, and what embark is doing at the moment.

**available services**

Available Services will display the services available to your dapp in green, if one of these is down then it will be displayed in red.

**logs and console**

There is a console at the bottom which can be used to interact with contracts or with embark itself. type ```help``` to see a list of available commands, more commands will be added with each version of Embark.

Creating a new DApp
======

If you want to create a blank new app.

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


```Json
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


```Json
# config/contracts.json
{
  "development": {
    "contracts": {
      "Currency": {
        "deploy": false,
        "args": [
          100
        ]
      },
      "Usd": {
        "instanceOf": "Currency",
        "args": [
          200
        ]
      },
      "MyCoin": {
        "instanceOf": "Currency",
        "args": [
          200
        ]
      }
    }
  }
}
  ...
```

Contracts addresses can be defined, If an address is defined the contract wouldn't be deployed but its defined address will be used instead.


```Json
# config/contracts.json
{
  ...
  "development": {
    "contracts": {
      "UserStorage": {
        "address": "0x123456"
      },
      "UserManagement": {
        "args": [
          "$UserStorage"
        ]
      }
    }
  }
  ...
}
```

EmbarkJS
======

EmbarkJS is a javascript library meant to abstract and facilitate the development of DApps.

**promises**

methods in EmbarkJS contracts will be converted to promises.

```Javascript
  var myContract = new EmbarkJS.Contract({abi: abiObject, address: "0x123"});
  myContract.get().then(function(value) { console.log("value is " + value.toNumber) });
```

**deployment**

Client side deployment will be automatically available in Embark for existing contracts:

```Javascript
  SimpleStorage.deploy().then(function(anotherSimpleStorage) {});
```

or it can be manually definied as

```Javascript
  var myContract = new EmbarkJS.Contract({abi: abiObject, code: code});
  myContract.deploy().then(function(anotherMyContractObject) {});
```

EmbarkJS - Storage
======

**initialization**

The current available storage is IPFS. it can be initialized as

```Javascript
  EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'})
```

**Saving Text**

```Javascript
  EmbarkJS.Storage.saveText("hello world").then(function(hash) {});
```

**Retrieving Data/Text**

```Javascript
  EmbarkJS.Storage.get(hash).then(function(content) {});
```

**Uploading a file**

```HTML
  <input type="file">
```

```Javascript
  var input = $("input[type=file"]);
  EmbarkJS.Storage.uploadFile(input).then(function(hash) {});
```

**Generate URL to file**

```Javascript
  EmbarkJS.Storage.getUrl(hash);
```

EmbarkJS - Communication
======

**initialization**

The current available communication is Whisper.

**listening to messages**

```Javascript
  EmbarkJS.Messages.listenTo({topic: ["achannel", "anotherchannel"]}).then(function(message) { console.log("received: " + message); })
```

**sending messages**

you can send plain text

```Javascript
  EmbarkJS.Messages.sendMessage({topic: "achannel", data: 'hello world'})
```

or an object

```Javascript
  EmbarkJS.Messages.sendMessage({topic: "achannel", data: {msg: 'hello world'}})
```

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


```$ embark blockchain production```

```$ embark run production```

The environment is a specific blockchain configuration that can be managed at config/blockchain.json

```Json
# config/blockchain.json
  ...
   "livenet": {
    "networkType": "livenet",
    "rpcHost": "localhost",
    "rpcPort": 8545,
    "rpcCorsDomain": "http://localhost:8000",
    "account": {
      "password": "config/production/password"
    }
  },
  ...
```

Structuring Application
======

Embark is quite flexible and you can configure you're own directory structure using ```embark.json```

```Json
# embark.json
{
  "contracts": ["app/contracts/**"],
  "app": {
    "css/app.css": ["app/css/**"],
    "js/app.js": ["embark.js", "app/js/**"],
    "index.html": "app/index.html"
  },
  "buildDir": "dist/",
  "config": "config/"
}
```

Deploying to IPFS
======

To deploy a dapp to IPFS, all you need to do is run a local IPFS node and then run ```embark ipfs```.
If you want to deploy to the livenet then after configuring you account on ```config/blockchain.json``` on the ```production``` environment then you can deploy to that chain by specifying the environment ```embark ipfs production```.

LiveReload Plugin
======

Embark works quite well with the LiveReload Plugin

Donations
======

If you like Embark please consider donating to 0x8811FdF0F988f0CD1B7E9DE252ABfA5b18c1cDb1
