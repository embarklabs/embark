title: Migrating from Embark 3.x
layout: docs
---

In this guide we'll discuss the few steps to take a project from Embark 3.2.x to 4.x.

If you already have 4.x, you can then upgrade to Embark 5 by continuing [below](/docs/migrating_from_3.x.html#Updating-to-v5).

## Upgrading to v4

In order to take an existing Embark 3.2.x project to version 4.x, the following steps are required:

1. Adding a `generationDir` to the project's `embark.json`
2. Updating "magic" EmbarkJS imports
3. Installing a blockchain connector
4. Updating blockchain account configurations

Let's walk through them step by step!

### Adding a `generationDir` to `embark.json`

Since version 4, Embark generates project [specific artifacts](/docs/javascript_usage.html#Embark-Artifacts). We need to tell Embark where to generate those artifacts. For new projects, this is not a problem as Embark will create the necessary configuration. However, for existing projects, we'll have to add a [`generationDir`](/docs/configuration.html#generationDir) property to our project's `embark.json` file.

```
...
"generationDir": "artifacts"
...
```

The value of `generationDir` is the name of the folder in which we want Embark to generate artifacts. For new projects, `artifacts` is the default.

### Updating "magic" EmbarkJS imports

Before version 4, EmbarkJS provided a couple of "magic" imports for applications that made it very convenient to get access to EmbarkJS itself, as well as Smart Contract instances.

The EmbarkJS library as well as Smart Contract instances will now be generated artifacts, meaning we'll have to update our imports to point to the right location.

For EmbarkJS, replace this import:

```
import EmbarkJS from 'Embark/EmbarkJS';
```
with
```
import EmbarkJS from './artifacts/embarkjs';
```

{% notification info 'Attention!' %}
Notice that the import path has to match the path we've specified in `generationDir` earlier.
{% endnotification %}

For Smart Contract instances, replace:

```
import CONTRACT_NAME from 'Embark/contracts/CONTRACT_NAME';
```

with

```
import CONTRACT_NAME from './artifacts/contracts/CONTRACT_NAME';
```

#### Remove web3 imports

Prior to version 4, EmbarkJS exported a Web3 instance as well. This is no longer the case as it caused a lot of compatibility issues with different Web3 versions. Please rely on the globally available Web3 instance instead.

Remove the following import from your application:

```
import web3 from 'Embark/web3';
```

### Updating Blockchain configurations

Embark 4 adds some new blockchain account configurations. To try to keep things as simple as possible, these additions are really similar to the ones in the Smart Contract configuration. For more information, please read the [Accounts Blockchain configuration guide](/docs/blockchain_accounts_configuration.html) in our docs.

However, we did introduce some small breaking changes. We removed:

- **account**: This is completely replaced by the new accounts property (notice the s at the end of accounts). It gives the developer more flexibility. To have exactly the same behavior as before, just use the `nodeAccounts` account type as described in the docs
- **simulatorMnemonic**: Removed in favor of Ganache’s default mnemonic. If this functionality is still needed, please specify the desired mnemonic in the [blockchain config’s mnemonic account type](/docs/blockchain_accounts_configuration.md#parameter-descriptions).


## Updating to v5

Embark's 5th version is full of improvements, especially in the configurations, all to make your life easier.

In this guide, we'll go through the different breaking changes introduced in Embark 5, that will let you upgrade from Embark 4.0.

### Better Smart Contract configuration

One of the two configurations that changed the most is the Smart Contract configuration. The goal of this change is to make this file **only** about Smart Contracts. That way, no more confusing connection values and accounts. Those were moved to the blockchain config and will be discussed [just below](/docs/migrating_from_3.x.html#Blockchain-config).

1. The `deployment` section was removed
    - It was moved to the Blockchain configuration as `endpoint`, which is way simpler than before
    - The accounts were also moved to the Blockchain configuration
2. `contracts` has been renamed to `deploy`
    - The goal is to match the rest of the properties, i.e. `afterDeploy` and `beforeDeploy`
    - And also enables us to add new features for `embark test`, whereby you can modify the Blockchain and module configs in each test. Read more [here](/docs/migrating_from_3.x.html#Tests)
3. New `dappConnection` variable: `$EMBARK`
    - This tells the Dapp to connect to Embark's proxy and node
        - Doing so let's you use the same accounts for deployment **and** in the Dapp
            - Plus, it let's you benefit from a couple of other features inside your Dapp
    - We recommend putting `$EMBARK` first in the `dappConnection` array in development, as it's the easiest way to develop your Dapp


### Simplified Blockchain configuration

The Blockchain configuration changed a lot, but in a good way, as it's **way** simpler now. Hopefully, with all those changes, you'll have an easier time understanding how the different configurations work.

1. Defaults everywhere!
    - Most of the configs you were used to seeing in Embark 4 are simply defaults in Embark 5
        - That means you don't have to specify them
        - You can find the basic configurations [here](/docs/blockchain_configuration.html#Common-Parameters)
        - If you want to modify some of the advanced parameters, you always can. Just put them in the `clientConfig` object. You can see all the options [here](/docs/blockchain_configuration.html#Advanced-parameters)
2. There were a couple of renamed parameters:
    - `isDev` => `miningMode: 'dev'`
        - This enables you to control the node's mining mode with only one option, instead of two (`isDev` and `mineWhenNeeded` were both removed)
    - `mineWhenNeeded` => `miningMode: 'auto'`
        - As said above, we combined the two options into `miningMode`
        - `auto` is the same as `mineWhenNeeded: true`
    - `ethereumClientName` => `client`
        - Just a basic rename, because it's shorter and is more agnostic
3. New `endpoint` parameter
    - This new parameter is the replacement for the Smart Contract configuration's `deployment` section
    - Before, you had to set `host`, `port` and `type` in the `deployement` section of the Smart Contracts configuration
    - Now, all the options are in `endpoint`
        - For example, you can just put `ws://localhost:1234` and Embark will connect to it
        - If the connection doesn't work, Embark will start the node using the endpoint
    - This makes it easier to connect to external nodes or change the local node configurations
4. The Blockchain configuration is now the **only** source of accounts
    - In Embark 4, there were `account` arrays in both the Smart Contract and Blockchain configs
    - In Embark 5, there is only a blockchain `accounts` array
    - The accounts there will be used for Smart Contract deployment, node creation **and** in the Dapp
        - Before you could see the accounts in your Dapp, but couldn't use them
        - Now, you can fund them, use them and debug with them
        - This is thanks to our new proxy
            - All you have to do is set `$EMBARK` as the `dappConnection` in Smart Contracts configuration to connect to Embark's proxy in your Dapp

Here is an example of how simple your Blockchain configuration can look now:

```javascript
module.exports = {
  default: {
    enabled: true,
    client: "geth"
  },

  development: {
    endpoint: 'ws://locahost:1234',
    clientConfig: {
      miningMode: 'dev'
    },
    accounts: [
      {
        mnemonic: "12 word mnemonic",
        balance: "5ether",
        numAddresses: 10
      }
    ]
  }
}
```

This will connect to a node started on you machine on the port `1234`, using a Websocket provider. If the node is not started, Embark will start it for you using Geth.

The accounts used for deployment will be the ones coming from a mnemonic, all funded with 5 ETH.

You can even use those accounts in your Dapp to test Smart Contract interactions, if `$EMBARK` is set in `dappConnection` in your Smart Contracts configuration.

You could remove the `endpoint` and `accounts` and Embark would still work with its defaults.

### Communication configuration

This is a very simple change, but in Embark 5, a specific node is started when using a Communication service like Whisper.

That means that if in your Communication configuration, you still point to the original port, it will conflict.

All you have to do is change that port (usually `8546`) to something else, say `8557`.

Here's what an updated Communication configuration would look like:

```javascript
module.exports = {
  default: {
    enabled: false,
    provider: "whisper",
    available_providers: ["whisper"],
    connection: {
      host: "localhost",
      port: 8557,
      type: "ws"
    }
  }
}
```

### Tests

There were few breaking changes related to `embark test`, mostly new features.

1. The `deployment` section was removed
    - Much like the changes above, the `deployment` section has been deprecated
    - You can still connect to an extenral node in tests and use custom accounts, it's just simpler
    - You can now add a `blockchain` section in the `config` function's object and use the `endpoint` and `accounts` options
2. `contracts` was renamed `deploy`
    - Again, the test configs match the actual configs
    - You now have the `contracts` section which represents the Smart Contract configuration, so you need the `deploy` parameter for the Smart Contract list
    - See the example below
3. New module configs
    - You can now configure the namesystem on a per test basis
    - Storage, Namesystem and Communication modules are disabled by default to speed up the test
        - You can enable them in your normal configuration files by adding the `test` environment and putting `enabled: true`
            - Just like normal environments, the `test` environment merges with the `default` section
            - All tests now default to the `test` environment, but you can still change this with `--environment`

Example of a test with the new configs:

```javascript
config({
  blockchain: {
    accounts: [
      {
        mnemonic: "12 word mnemonic",
        balance: "5ether",
        numAddresses: 10
      }
    ]
  },
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      }
    }
  },
  namesystem: {
    enabled: true,
    register: {
      "rootDomain": "test.eth"
    }
  }
});

describe(() => {
  // Tests here
});
```

This example deploys one Smart Contract, SimpleStorage, using the first of 10 accounts, generated from the mnemonic, which will be funded to 5 ETH.

The Namesystem will also be enabled, with a root domain of `test.eth`, meaning you will be able, in your tests, to do `EmbarkJS.Names.resolve('test.eth')` and it will resolve to the owner of the name (the default account).

Like before, those configs are all optional; but they allow you more flexibility, with simpler configuration objects that are easier to understand.

### Library and Version updates

#### NodeJS

To upgrade to Embark 5, you will first need to install  Node.js version 10.17 or above, but not beyond 10.x for now.

The reason for that limit is because 12.x cause issues with some of the underlying Embark dependencies, which do not support Node 12.x yet.

#### Version manager

In Embark 4, you could select the version of a couple of libraries in `embark.json`'s `versions` object. As of Embark 5, only `solc` is available to modify.

We deprecated the other libraries because they were rarely changed and most importantly, because their different versions had breaking changes that were annoying to support at the same time. With those deprecations, we ensure you the best experience possible when using the libraries offered.

#### ipfs-api

We upgraded from the old `ipfs-api` to `ipfs-http-client`, because the former was deprecated.

For most of you, no change is required, since EmbarkJS handles the API changes.

However, if you did import `ipfs-api` yourself in your front-end Dapp, you'll need to change it to `ipfs-http-client`, because `ipfs-api` is no longer installed as part of Embark 5.
Also, if you'll be using it directly, be sure to review the [docs for `ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client#usage) as there have been some API changes relative to `ipfs-api`.

