title: Configuring EmbarkJS
layout: docs
---

Embark includes in your Dapp the EmbarkJS library. This library abstracts different functionalities, so you can easily & quickly build powerful Dapps that leverage different decentralized technologies.
Embark will automatically initialize EmbarkJS with the configurations set for your particular environment. You just need to connect it to a blockchain node, like explained [below](#Connecting).

### Connecting

Before using EmbarkJS and Contract functions, we need to make sure that Embark is connected to a blockchain node.

For that, EmbarkJS provides the `Blockchain.connect()` function that receives a configuration object.
Luckily, Embark generates the necessary config by looking at your configuration files and outputs it in its generation folder. The default directory is `embarkArtifacts/`, but you can change that in `embark.json` by changing `generationDir`.

Let's see what that generated config file looks like at `embarkArtifacts/config/blockchain.json`:

```
{
  "dappConnection": [
    "$WEB3",
    "$EMBARK",
    "ws://localhost:8546"
  ],
  "dappAutoEnable": true,
  "warnIfMetamask": true,
  "blockchainClient": "geth"
}
```


#### Connection parameters:

- **dappConnection**: Copied from the contracts config. This is the list of connections Embark will try to connect to in order. For more information, look at [the guide on EmbakJS](/docs/javascript_usage.html#Using-dappConnection).
- **dappAutoEnable**: Copied from the contracts config. This tells EmbarkJS to either automatically connect to Metamask (or Mist) or wait for the developper (you) to do it.
 - Read more on it [below](#Provider)
- **warnIfMetamask**: Is true when `isDev` is true in the blockchain config. Will warn you in the console if Metamask is detected, to make sure you connect Metamask correctly to the local node.
- **blockchainClient**: Copied from the blockchain config. This tells EmbarkJS which blockchain client it is connecting to and it will warn about the different problematic behaviours you could experience.


### Utilities

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

### Provider

As of [EIP1102](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md), decentralized applications MUST request account access. Embark offers several options on how to implement this.

An Embark application's Smart Contract configuration file (typically located in `config/contracts.js`) comes with a `dappAutoEnable` property which controls whether or not EmbarkJS should automatically try to request account access:
```
...
  // Automatically call `ethereum.enable` if true.
  // If false, the following code must run before sending any transaction: `await EmbarkJS.enableEthereum();`
  // Default value is true.
  // dappAutoEnable: true,
...
```


By default, the value of `dappAutoEnable` is true which means that Embark will call `ethereum.enable` for you to request account access when the first page of the dapp is loaded.

If you want more control, you can set `dappAutoEnable` to false.
Then, if you want to request account access, you can use the following code:

```
...
  try {
    const accounts = await EmbarkJS.enableEthereum();
    // access granted
  } catch() {
    // access not granted
  }
...
```

This will request account access and if the user grants access to his accounts, you will be able to make transaction calls.


### Components

* [EmbarkJS.Contract](contracts_javascript.html) - To interact with smart contracts. Typically Embark automatically initializes all your deployed contracts with this. uses web3.js 1.2.6
* [EmbarkJS.Storage](storage_javascript.html) - To interact with the configured decentralized storage. Includes bindings to save & retrieve data, upload & download files, etc..
* [EmbarkJS.Communication](messages_javascript.html) - To interact with the configured decentralized messages system. Includes bindings to listen to topics and send messages.
* [EmbarkJS.Names](naming_javascript.html) - To interact with the configured decentralized naming system such as ENS. Includes bindings to look up the address of a domain name as well as retrieve a domain name given an address.
