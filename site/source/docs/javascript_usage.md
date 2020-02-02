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

## Using `dappConnection`

After reading the section above on `EmbarkJS.onReady`, you might be wondering where EmbarkJS establishes a connection.

The answer is: you decide! You can configure it using `dappConnection`, a config property you can find in the Smart Contract config (by default at `config/contracts.js`).

You will notice that property name reused in some other config files too, like the Storage one, because you can configure where those connect as well.

The expressions used within `dappConnection` come with special semantics. Here's how they work: it is an array of strings where EmbarkJS will try each of those in order (from 0 to N) and as soon as one of the connections work, it will stop.

In the case of the Smart Contract config `dappConnection`, the one that is used to connect to the blockchain node and that is indirectly used in `EmbarkJS.onReady`, you will see two special entities: `$WEB3` and `$EMBARK`.

- `$WEB3` tells EmbarkJS to connect to the browser's web3 instance. For example, Metamask or Status.
- `$EMBARK` tells EmbarkJS to connect to Embark's wallet, implemented using a proxy in between the Dapp and the blockchain node.
  - This let's you use you own accounts, as set up in your Blockchain config's `accounts` section
    - If you don't use custom accounts, using `$EMBARK` is still useful, because it connects to the node more easily for you and uses the unlocked accounts on the node, like when using the `dev` `miningMode`
  - Also, Embark gets to see the transactions processed and logs them back to you in a human readable manner

If you want, you can also put a valid node URL in the `dappConnection` array. In that case, EmbarkJS will connect directly to the node, without using Embark's proxy.
It is, however, not recommended as you lose some of Embark's features, like the transaction logger.

If you want to use an external node,  like Infura, we instead recommend to set it in the Blockchain config (`config/blockchain.js`) using the property `endpoint`.
Then, using `$EMBARK` will use Embark's proxy, which in part will be connected to that endpoint.

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

* [EmbarkJS.Contract](contracts_javascript.html) - To interact with smart contracts. Typically Embark automatically initializes all your deployed contracts with this. uses web3.js 1.2.6
* [EmbarkJS.Storage](storage_javascript.html) - To interact with the configured decentralized storage. Includes bindings to save & retrieve data, upload & download files, etc..
* [EmbarkJS.Communication](messages_javascript.html) - To interact with the configured decentralized messages system. Includes bindings to listen to topics and send messages.
* [EmbarkJS.Names](naming_javascript.html) - To interact with the configured decentralized naming system such as ENS. Includes bindings to look up the address of a domain name as well as retrieve a domain name given an address.
