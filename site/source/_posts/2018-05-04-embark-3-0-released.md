title: Embark by Status 3.0
author: iuri_matias
summary: "We're happy to announce that Embark 3.0 has been released! Read on for what's inside!"
categories:
  - announcements
layout: blog-post
alias: news/2018/05/03/embark-3-0-released/
---

Embark is now part of [Status](https://status.im/) and we are happy to announce Embark 3.0 by Status!

## New website and Documentation

Embark has a new website and up to date documentation which can be found at https://embark.status.im/docs/

## More Smart Contract Languages

Besides Solidity, Embark now also supports [Vyper](https://github.com/ethereum/vyper/) out of the box, as well as [Bamboo](https://github.com/pirapira/bamboo) through an embark [plugin](https://github.com/embarklabs/embark-bamboo)
You can use these languages side by side, and take advantage of Embark's features such as contract testing just like you would with Solidity.

## DApp Imports

From the dapp side, contracts and libs like EmbarkJS can be implicitly imported, for e.g to import a contract:

```Javascript
import SimpleStorage from 'Embark/contracts/SimpleStorage'
```

EmbarkJS:

```Javascript
import EmbarkJS from 'Embark/EmbarkJS'
```

Or a initialized web3 instances (with the config of `config/contracts.json`)

```Javascript
import web3 from 'Embark/web3'
```

The typical ES6 imports will also simply work. You can even import directly css files inside js files:

```Javascript
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

import './dapp.css';
```

## Friendlier torwards contracts-only projects

Although Embark is focused on DApps, it can perfectly be used for projects targeting only smart contracts and no other components.

There is a now a template to create a simple project with all the components disabled except smart contracts:

`embark new AppName --simple`

You can also fine tune this in embark.json by specifying the config of each component or setting it to false if you don't want it.

```JSON
  ...
  "config": {
    "contracts": "contracts.json",
    "blockchain": false,
    "storage": false,
    "communication": false,
    "webserver": false
  },
  ...
```

## Embark Graph

The command `embark graph` will generate a ER graph of the dapp contracts. This takes into account not just the inheritance but also the relationships specified in the configuration.

## Config contracts from URIs

Embark now supports referencing directly URIs including http, git, github, or directly files contained in other directories than the ones specified in embark.json

Embark is smart enough to take care of the dependencies of the resources and present them in a consistent manner to the compiler, it just works!

```JSON
{
  "development": {
    "contracts": {
      "ERC725": {
        "file": "git://github.com/status/contracts/contracts/identity/ERC725.sol#develop"
      },
      "ERC725": {
        "file": "github.com/status/contracts/contracts/identity/ERC725.sol"
      },
      "Ownable": {
        "file": "https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol"
      },
      "SimpleStorage": {
        "file": "./some_folder/simple_storage.sol"
      }
    }
  }
}
```

## Importing contracts from URIs directly in Solidity

You can also import the same URIs directly in solidity which is quite useful for interfaces, e.g:

```Javascript
import "git://github.com/status/contracts/contracts/identity/ERC725.sol#develop";
import "github.com/status/contracts/contracts/identity/ERC725.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol"

contract MyContract is Ownable {
  ...
}
```

## Contracts from npm packages

You can now install npm packages that contain contracts (e.g `npm install --save openzeppelin-solidity`) and refer them to them in the contracts.json file:

```Javascript
{
  "development": {
    "contracts": {
      "ERC20": {
        file: "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol"
      }
    }
  }
}
```

or even import them directly in solidity without the need for the config:

```Solidity
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MyContract is Ownable {
  ...
}
```

## Embark Demo App

The demo app has been updated to reflect the new structure. It also now uses ReactJS which provides a good example on how to use React with Embark.

## Web3.js 1.0 by default

Embark now uses web3.js 1.0 in all layers, including in the console and in contracts testing.


## More contract deploy configs

A new config called `afterDeploy` is available and it can be used to specify actions to run after all contracts have been deployed.
It's possible to also specify the specific account to deploy from using the directive `from` or `fromIndex`

## Versions Configuration

The versions config has been moved to embark.json, the download mechanism has also been fastly improved under the hood:

```
  ...
  "versions": {
    "web3": "1.0.0-beta",
    "solc": "0.4.23",
    "ipfs-api": "17.2.4"
  },
  ...
```


## Test Improvements

In the tests you can now specify a mnemonic:

```Javascript
config({
  mnemonic: "labor ability deny divide mountain buddy home client type shallow outer pen"
})
````

It's also possible to specify a node, in case you don't want to run in the internal vm:

```Javascript
config({
  node: "http://localhost:8545"
})
````

## Swarm support

Swarm is now completely integrated on-par with IPFS. You can use interact with Swarm on the dapp side, as well as upload your dapp to Swarm.Swarm

## Misc Bugfixes and Improvements

For a complete list please refer to the [release notes in github](https://github.com/embarklabs/embark/releases/tag/3.0.0)

## Chatroom

To discuss about Embark or Dapp development, please [join us at the gitter channel](https://gitter.im/embark-framework/Lobby)

