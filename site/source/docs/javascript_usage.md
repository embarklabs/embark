title: Using EmbarkJS
layout: docs
---

In order to make decentralized app development as easy as possible, Embark offers a useful companion JavaScript library called **EmbarkJS**. It comes with many APIs that make your applications connect to decentralized services such as your Smart Contracts or IPFS. This guide gives a brief overview on how to set up EmbarkJS and make it connect to a blockchain node.

## Embark Artifacts

First of all it's important to understand where EmbarkJS comes from. Whenever `embark run` is executed, Embark will generate the EmbarkJS library and put it in the configured `generationDir`, as discussed in [configuring Embark](/docs/configuration.html). This EmbarkJS library is called an artifact and is just one of many other artifacts that Embark generates for later usage.

Other artifacts that Embark generates are:

- Smart Contract ABIs
- Bootstrapping code
- Configuration data

We'll discuss these more in this guide.

## Importing EmbarkJS

Once Embark has generated all necessary artifacts, we can start using them when building an application. Artifacts are really just written to disc, so if we want to get hold of any of them, it's really just a matter of importing them accordingly.

The following code imports EmbarkJS:

```
import EmbarkJS from './embarkArtifacts/embarkjs';
```

## Connecting to a Blockchain node

EmbarkJS offers different APIs for various decentralized services. Some of them can be used right away, others require Embark to do some initial work first. For example, in order to use any [methods of Smart Contract instances](/docs/contracts_javascript.html), it's important that EmbarkJS is actually connected to a blockchain node.

This can be done using the `EmbarkJS.Blockchain.connect()` API. This method takes a configuration object which specifies what node to connect to, and receives a callback that will be called once Embark has connected successfully.

### Installing a blockchain connector

Before the `EmbarkJS.Blockchain.connect()` API can be used, we need to install a blockchain connector plugin. This is required because Embark doesn't have a strong opinion about which connector library we should use. Some people like to use `web3.js`, others prefer libraries like `ethers.js`. Once we know which library to use, we'll have to install a dedicated connector plugin. The Embark project maintains a blockchain connector for the `web3.js` library called `embarkjs-connector-web3`.

There are a few different ways to install the plugin. We can either use `yarn` or `npm` like this:

```
$ npm install --save embarkjs-connector-web3
```

And

```
$ yarn add embarkjs-connector-web3
```

Another option is to use Embark's very own `plugin` command that can be run from its [Interactive Console](/docs/using_the_console.html):

```
$ Embark (development) > plugin install embarkjs-connector-web3<ENTER>
```

Once installed, all we have to do is adding the plugin to our project's [embark.json](/docs/configuration.html):

```
...
"plugins": {
  "embarkjs-connector-web3": {}
}
...
```

This will tell Embark to load the plugin on startup and register all necessary providers needed to connect to a blockchain. For more information about installing and creating plugins and other custom blockchain connectors, head over to our [Plugins guide](/docs/installing_plugins.html).

### Blockchain configuration data

As mentioned earlier, `EmbarkJS.Blockchain.connect()` takes a configuration object that describes how to connect to a blockchain node. If we're familiar with what configuration data is needed, and if we want more fine-grain control over how EmbarkJS is connecting to a node, we can provide this data manually. Otherwise, Embark generates an artifact for the needed configuration as well, so we can just import that and use it accordingly.

The configuration data can be found in `embarkArtifacts/config/blockchain.json` and looks something like this:

```
{
  "dappConnection": [
    "$WEB3",
    "ws://localhost:8546",
    "http://localhost:8545"
  ],
  "dappAutoEnable": true,
  "warnIfMetamask": true,
  "blockchainClient": "geth"
}
```

These configuration values may or may not make a lot of sense at the moment, but here's a quick run down on what they are:

- **dappConnection**: Copied from the Smart Contracts configuration. This is the list of connections Embark will try to connect to in order.
- **dappAutoEnable**: Copied from the Smart Contracts  configuration. This tells EmbarkJS to either automatically connect to Metamask (or Mist) or wait for the app to call an API
- **warnIfMetamask**: Is `true` when `isDev` is true in the blockchain configuration. Will warn users in the console if Metamask is detected, to make sure Metamask is connected correctly to the local node.
- **blockchainClient**: Copied from the blockchain configuration. This tells EmbarkJS which blockchain client it is connecting to and it will warn about different problematic behaviours one could experience.

### Using `Blockchain.connect()` 

Connecting to a Blockchain node is really just a matter of calling `Blockchain.connect()` with the configuration data and ideally a callback in which we're doing the rest of our application's work.

```
import config from './embarkArtifacts/config/blockchain';

EmbarkJS.Blockchain.connect(config, error => {
  if (error) {
    ...
  }
  ...
});
```

We can also use `Blockchain.connect()` using a Promise-based API:

```
EmbarkJS.Blockchain.connect(config).then(() => {
  ...
});
```

Which, of course works great with `async/await`:

```
await EmbarkJS.Blockchain.connect(config);
```

## Requesting account access

As of [EIP1102](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md), decentralized applications MUST request access to a DApp's user accounts. Embark offers several options on how to implement this.

An Embark application's Smart Contract configuration file (typically located in `config/contracts.js`) comes with a `dappAutoEnable` property which controls whether or not EmbarkJS should automatically try to request account access:
```
module.exports = {
  ...
  // Automatically call `ethereum.enable` if true.
  // If false, the following code must run before sending any transaction: `await EmbarkJS.enableEthereum();`
  dappAutoEnable: true,
  ...
}
```

By default, the value of `dappAutoEnable` is `true` which means that Embark will call `ethereum.enable` for us to request account access when the first page of the DApp is loaded.

If we want more control over when our application should request account access, we can set `dappAutoEnable` to false and make use of `EmbarkJS.enableEthereum()`.

This method will essentially cause our application to request account access, giving us full control over when this should happen. 

```
try {
  const accounts = await EmbarkJS.enableEthereum();
  // access granted
} catch() {
  // access not granted
}
```

## Additional APIs

This guide only touched on getting started with EmbarkJS. There are many more APIs to explore, depending on what we're achieving to build. Have a look at the dedicated guides to learn more:

* [EmbarkJS.Contract](contracts_javascript.html) - To interact with smart contracts. Typically Embark automatically initializes all your deployed contracts with this. uses web3.js 1.0
* [EmbarkJS.Storage](storage_javascript.html) - To interact with the configured decentralized storage. Includes bindings to save & retrieve data, upload & download files, etc..
* [EmbarkJS.Communication](messages_javascript.html) - To interact with the configured decentralized messages system. Includes bindings to listen to topics and send messages.
* [EmbarkJS.Names](naming_javascript.html) - To interact with the configured decentralized naming system such as ENS. Includes bindings to look up the address of a domain name as well as retrieve a domain name given an address.


