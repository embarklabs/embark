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

### Installing a blockchain connector

Before the Embark can connect to the blockchain, we need to install a blockchain connector plugin. This is required because Embark doesn't have a strong opinion about which connector library we should use. Some people like to use `web3.js`, others prefer libraries like `ethers.js`. Once we know which library to use, we'll have to install a dedicated connector plugin. The Embark project maintains a blockchain connector for the `web3.js` library called `embarkjs-connector-web3`.

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

## Waiting for EmbarkJS to be ready

EmbarkJS also includes a `onReady` function. This is very useful to ensure that your Dapp only starts interacting with contracts when the proper connection to web3 has been made and ready to use.

```
import EmbarkJS from 'Embark/EmbarkJS';
import SimpleStorage from 'Embark/contracts/SimpleStorage';

EmbarkJS.onReady((error) => {
  if (error) {
    console.error('Error while connecting to web3', error);
    return;
  }
  SimpleStorage.methods.set(100).send();
});
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


