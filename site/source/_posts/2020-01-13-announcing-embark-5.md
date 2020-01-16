title: Introducing Embark 5
author: pascal_precht
summary: "About half a year after our last stable release, we've now published Embark version 5 with lots of features, improvements and fixes. Read on for more information!"
categories:
  - announcements
layout: blog-post
---

If you've been following the development of Embark you're probably aware that we regularly put out alpha and beta releases for upcoming major or feature versions of Embark. In the past ~6 months since the release of Embark 4, we've published 10 alpha releases and one beta release for Embark 5 and today we're happy to announce the Embark 5 stable release!

In this post we'll be looking at some of the main changes and features to get up and running with v5. Notice that we've add a [migration guide](https://embark.status.im/docs/migrating_from_3.x.html#Updating-to-v5) to our official docs as well.

## New Features

Let's first start with new features that have been introduced in Embark 5.

### Whisper client configuration

Prior to Embark 5, Embark would use the same blockchain client to enable blockchain features and communication features for Whisper. With Embark 5, Embark spins up a separate client for Whisper. This also ensures that that Whisper service stays in tact when the blockchain service is turned off and vice versa.

To specify a client, use the new `client` configuration property which defaults to `geth`:

```js
// communication.js

...
default: {
  ...
  client: "geth" // can be either 'geth' or 'parity'
},
...

```

### Support for Dynamic Addresses

If you're using Embark already, you're probably aware that there are many different ways to [configure your Smart Contracts](/docs/contracts_configuration.html). One of the things that can be configured is the `address` of a Smart Contract. Usually the address will be determined after a Smart Contract has been deployed. In other cases, what we want to do is simply specifying the address because the Smart Contract is already deployed to the network.

There's one more case that hasn't been covered so far: Calculating a Smart Contract address dynamically as it's scheduled for deployment. This is useful when the address of a Smart Contract is the result of the interaction with another Smart Contract that is already instantiated on the network.

The following example configures `MyContract` to get its address from a call made to `AnotherContract`'s API:

```js
...
deploy: {
  AnotherContract: {...},
  MyContract: {
    deps: ["AnotherContract"]
    address: async (deps) => {
      const receipt = await deps.contracts.AnotherContract.methods.someFunction();
      return receipt.events.SomeEvent.returnValues.someAddress;
    }
  }
}
...
```

## Breaking changes

Next up, let's quickly talk about the few breaking changes we've introduced to improve the overall developer experience. It's worth noting that we try to keep breaking changes at a minimum and if it's indeed unavoidable, we put lots of effort into keeping the necessary changes as small as possible.

### NodeJS support

Due to some package dependencies, Embark doesn't yet support Node's [*Current* version](https://nodejs.org/en/about/releases/) version (13.x) or latest LTS version (12.x). Embark 5 runs with any node version `>= 10.17.0` and `< 12.0.0`. It also requires npm `>= 6.11.3` (bundled with Node `10.17.0`) or yarn `>= 1.19.1`.

### New Smart Contract configuration API

Embark's Smart Contract configuration has been highly declarative from day one. Configuring different deployment options and settings for various scenarios is a largely descriptive process when using Embark. However, we felt there was still room for improvement. Especially because Embark handles not only Smart Contract configurations, but also configurations for elements such as the user's choice of blockchain client. This sometimes caused confusion for our users since they weren't sure where certain configurations should go.

That's why we've made the following changes:

### Deployment section moved to Blockchain config

The `deployment` section of the Smart Contract configuration has been completely moved to the Blockchain configuration as discussed in a moment. This section was primarily used to specify things like the `host`, `port` and `protocol` being used to connect to a node to which you Smart Contracts will be deployed, as well as the accounts configuration.

Here's what such a config looked like prior to v5:

```js
...
deployment: {
  host: "localhost", // Host of the blockchain node
  port: 8546, // Port of the blockchain node
  type: "ws" // Type of connection (ws or rpc),
  accounts: [...]
},
...
```

There's no equivalent for this configuration inside the Smart Contract configuration in Embark 5, so this section can be entirely (re)moved.

### `contracts` property has been renamed to `deploy`

When configuring Smart Contracts, there are a few deployment hooks that can be specified, such as `beforeDeploy` and `afterDeploy`. To make the API a bit more descriptive and to clarify intent, the `contracts` property has been renamed to `deploy`, aligning wonderfully with its deployment hooks counterparts.

Before:

```js
...
contracts: {
  SimpleStorage: {
    fromIndex: 0,
    args: [100],
    onDeploy: async () => { ... },
    deployIf: async () => { ... }
  }
}
...
```

After:

```js
...
deploy: {
  SimpleStorage: {
    fromIndex: 0,
    args: [100],
    onDeploy: async () => { ... },
    deployIf: async () => { ... }
  }
}
...
```

### Polished Blockchain configuration API

One of the most complex APIs has been Embark's Blockchain configuration API. That's why we've put a lot of effort into streamlining the settings and properties and removing the ones that happened to be redundant. On top of that, Embark now defines most of them as defaults, resulting in significantly smaller and less complex configuration files.

The following configuration properties have been renamed:

- `isDev` is now `miningMode: 'dev'`
- `mineWhenNeeded` is now `miningMode: 'auto'`
- `ethereumClientName` is now `client`

We've also removed several endpoint-related settings, such as `host` and `port`, and replaced them with a single `endpoint` property. Here's what the new defaults look like:

```js
module.exports = {
  default: {
    enabled: true,
    client: "geth"
  },
  development: {
    clientConfig: {
      miningMode: 'dev'
    }
  },
  testnet: {
    endpoint: "https://external-node.com",
    accounts: [
      {
        mnemonic: "12 word mnemonic"
      }
    ]
  }
}
```

For more information on Blockchain configuration, head over to the [official docs](/docs/blockchain_configuration.html).

### Accounts configuration moved to Blockchain config

Prior to Embark 5 it was possible to specify and configure various accounts for deployment and interaction both inside the Smart Contract configuration and the Blockchain configuration. This caused a lot of confusion because it wasn't really clear which accounts belonged to what action. To eliminate confusion, we've moved the accounts configuration entirely to the Blockchain configuration, making it much more straightforward to find the right place when setting up custom accounts.

Just like before, accounts can be defined using different configuration settings, depending on the use case:

```js
...
accounts: [
  {
    nodeAccounts: true,
    numAddresses: "1",
    password: "config/development/devpassword"
  },
  {
    privateKey: process.env.MyPrivateKey
  },
  {
    privateKeyFile: "path/to/file",
    password: process.env.MyKeyStorePassword
  },
  {
    mnemonic: process.env.My12WordsMnemonic,
    addressIndex: "0",
    numAddresses: "1",
    hdpath: "m/44'/60'/0'/0/"
  }
]
...
```

Check out the documentation on [accounts configuration](/docs/blockchain_accounts_configuration.html) for more information.

### Configuring tests

All the configuration changes discussed above have been ported and made available inside the test runner as well. In other words, when using Embark's `config()` function inside test suites, the same configuration APi applies:

```javascript
config({
  contracts: {
    deploy: {
      SomeContract: {} // options as discussed in the Smart Contract configuration guide
    }
  }
});
```

Testing is covered in-depth in our [testing guide](/docs/contracts_testing.html).

To see any of the new APIs in action, have a look at our [template](https://github.com/embarklabs/embark/tree/ba0d6d17f30018d8258c65d85f17bea100c3ad0a/dapps/templates) and [test dapps](https://github.com/embarklabs/embark/tree/ba0d6d17f30018d8258c65d85f17bea100c3ad0a/dapps/tests) in the official Embark repository.

Obviously we've worked on many more things as part of the v5 release. For a full list of features and bug fixes, head over to our [changelog](https://github.com/embarklabs/embark/blob/master/CHANGELOG.md#500-2020-01-07).

As always, we encourage our users to install the latest version of Embark and give it a spin. Feedback is very welcome and we can't wait to see the great apps you'll be building with it!
