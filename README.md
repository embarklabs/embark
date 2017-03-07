[![Join the chat at https://gitter.im/iurimatias/embark-framework](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/iurimatias/embark-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build
Status](https://travis-ci.org/iurimatias/embark-framework.svg?branch=develop)](https://travis-ci.org/iurimatias/embark-framework)
[![Code Climate](https://codeclimate.com/github/iurimatias/embark-framework/badges/gpa.svg)](https://codeclimate.com/github/iurimatias/embark-framework)

What is Embark
======

Embark is a framework that allows you to easily develop and deploy Decentralized Applications (DApps).

A Decentralized Application is serverless html5 application that uses one or more decentralized technologies.

Embark currently integrates with EVM blockchains (Ethereum), Decentralized Storages (IPFS), and Decentralizaed communication platforms (Whisper and Orbit). Swarm is supported for deployment.

With Embark you can:

**Blockchain (Ethereum)**
* Automatically deploy contracts and make them available in your JS code. Embark watches for changes, and if you update a contract, Embark will automatically redeploy the contracts (if needed) and the dapp.
* Contracts are available in JS with Promises.
* Do Test Driven Development with Contracts using Javascript.
* Keep track of deployed contracts, deploy only when truly needed.
* Manage different chains (e.g testnet, private net, livenet)
* Easily manage complex systems of interdependent contracts.

**Decentralized Storage (IPFS)**
* Easily Store & Retrieve Data on the DApp through EmbarkJS. Includin uploading and retrieving files.
* Deploy the full application to IPFS or Swarm.


**Decentralized Communication (Whisper, Orbit)**
* Easily send/receive messages through channels in P2P through Whisper or Orbit.

**Web Technologies**
* Integrate with any web technology including React, Foundation, etc..
* Use any build pipeline or tool you wish, including grunt, gulp and webpack.

Table of Contents
======
* [Installation](#installation)
* [Usage Demo](#usage---demo)
* [Dashboard](#dashboard)
* [Creating a new DApp](#creating-a-new-dapp)
* [Libraries and APIs available](#libraries-and-languages-available)
* [Using and Configuring Contracts](#dapp-structure)
* [EmbarkJS](#embarkjs)
* [EmbarkJS - Storage (IPFS)](#embarkjs---storage)
* [EmbarkJS - Communication (Whisper/Orbit)](#embarkjs---communication)
* [Testing Contracts](#tests)
* [Working with different chains](#working-with-different-chains)
* [Custom Application Structure](#structuring-application)
* [Deploying to IPFS](#deploying-to-ipfs)
* [Extending Functionality with Plugins](#plugins)
* [Donations](#donations)

Installation
======
Requirements: geth (1.5.8 or higher), node (6.9.1 or higher is recommended) and npm
Optional: testrpc (3.0 or higher) if using the simulator or the test functionality.
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

![Embark Demo screenshot](http://i.imgur.com/a9ddSjn.png)

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

By default embark blockchain will mine a minimum amount of ether and will only mine when new transactions come in. This is quite usefull to keep a low CPU. The option can be configured at ```config/blockchain.json```. Note that running a real node requires at least 2GB of free ram, please take this into account if running it in a VM.

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

Libraries and languages available
======

Embark can build and deploy contracts coded in Solidity. It will make them available on the client side using EmbarkJS and Web3.js.

Further documentation for these can be found below:

* Smart Contracts: [Solidity](https://solidity.readthedocs.io/en/develop/) and [Serpent](https://github.com/ethereum/wiki/wiki/Serpent)
* Client Side: [Web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) and [EmbarkJS](#embarkjs)

Using Contracts
======
Embark will automatically take care of deployment for you and set all needed JS bindings. For example, the contract below:

```Javascript
# app/contracts/simple_storage.sol
pragma solidity ^0.4.7;
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
SimpleStorage.get().then(function(value) { console.log(value.toNumber()) });
SimpleStorage.storedData().then(function(value) { console.log(value.toNumber()) });
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

events:

```Javascript
  myContract.eventName({from: web3.eth.accounts}, 'latest').then(function(event) { console.log(event) });
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

note: if not using localhost, the cors needs to be set as ```ipfs --json API.HTTPHeaders.Access-Control-Allow-Origin '["your-host-name-port"]```

EmbarkJS - Communication
======

**initialization**

For Whisper:

```Javascript
    EmbarkJS.Messages.setProvider('whisper')
```

For Orbit:

You'll need to use IPFS from master and run it as: ```ipfs daemon --enable-pubsub-experiment```

then set the provider:

```Javascript
  EmbarkJS.Messages.setProvider('orbit', {server: 'localhost', port: 5001})
```

**listening to messages**

```Javascript
  EmbarkJS.Messages.listenTo({topic: ["topic1", "topic2"]}).then(function(message) { console.log("received: " + message); })
```

**sending messages**

you can send plain text

```Javascript
  EmbarkJS.Messages.sendMessage({topic: "sometopic", data: 'hello world'})
```

or an object

```Javascript
  EmbarkJS.Messages.sendMessage({topic: "sometopic", data: {msg: 'hello world'}})
```

note: array of topics are considered an AND. In Whisper you can use another array for OR combinations of several topics e.g ```["topic1", ["topic2", "topic3"]]``` => ```topic1 AND (topic2 OR topic 3)```

Tests
======

You can run specs with ```embark test```, it will run any test files under ```test/```.

Embark includes a testing lib to fastly run & test your contracts in a EVM.

```Javascript
# test/simple_storage_spec.js

var assert = require('assert');
var Embark = require('embark');
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


```$ embark blockchain livenet```

```$ embark run livenet```

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
      "password": "config/livenet/password"
    }
  },
  ...
```

Structuring Application
======

Embark is quite flexible and you can configure your own directory structure using ```embark.json```

```Json
# embark.json
{
  "contracts": ["app/contracts/**"],
  "app": {
    "css/app.css": ["app/css/**"],
    "images/": ["app/images/**"],
    "js/app.js": ["embark.js", "app/js/**"],
    "index.html": "app/index.html"
  },
  "buildDir": "dist/",
  "config": "config/",
  "plugins": {}
}
```

Deploying to IPFS and Swarm
======

To deploy a dapp to IPFS, all you need to do is run a local IPFS node and then run ```embark upload ipfs```.
If you want to deploy to the livenet then after configuring you account on ```config/blockchain.json``` on the ```livenet``` environment then you can deploy to that chain by specifying the environment ```embark ipfs livenet```.

To deploy a dapp to SWARM, all you need to do is run a local SWARM node and then run ```embark upload swarm```.

Plugins
======

It's possible to extend Embarks functionality with plugins. For example the following is possible:

* plugin to add support for es6, jsx, coffescript, etc (``embark.registerPipeline``)
* plugin to add standard contracts or a contract framework (``embark.registerContractConfiguration`` and ``embark.addContractFile``)
* plugin to make some contracts available in all environments for use by other contracts or the dapp itself e.g a Token, a DAO, ENS, etc.. (``embark.registerContractConfiguration`` and ``embark.addContractFile``)
* plugin to add a libraries such as react or boostrap (``embark.addFileToPipeline``)
* plugin to specify a particular web3 initialization for special provider uses (``embark.registerClientWeb3Provider``)
* plugin to create a different contract wrapper (``embark.registerContractsGeneration``)
* plugin to add new console commands (``embark.registerConsoleCommand``)
* plugin to add support for another contract language such as viper, LLL, etc (``embark.registerCompiler``)

For more information on how to develop your own plugin please see the [plugin documentation](http://embark.readthedocs.io/en/latest/plugins.html)

Donations
======

If you like Embark please consider donating to 0x8811FdF0F988f0CD1B7E9DE252ABfA5b18c1cDb1
