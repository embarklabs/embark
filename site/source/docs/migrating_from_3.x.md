title: Migrating from Embark 3.x
layout: docs
---

With the release of version 4, Embark has introduced a few breaking changes that require developers to take action, if they plan to upgrade.

In this guide we'll discuss the few steps to take a project from Embark 3.2.x to 4.x.

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

### Installing a blockchain connector

As discussed in our guide on [using EmbarkJS](/docs/javascript_usage.html#Installing-a-blockchain-connector), EmbarkJS no longer has an opinion about which library to use to connect to a blockchain. You can use any library of your choice, whether it's `web3` or `ethers.js` or anything else.

All you have to do is installing the library and a dedicated connector plugin. The Embark project already comes with a connector plugin for `web3` and can be installed using either yarn or npm, or Embark's very own `plugin install` command:

```
$ npm install embarkjs-connector-web3
```
Or
```
$ yarn add embarkjs-connector-web3
```
Or
```
Embark (development) > plugin install embarkjs-web3-connector<ENTER>
```

Once installed we need to tell Embark to load the plugin. This is done by adding it to the `embark.json` plugins section:

```
...
"plugins": {
  "embarkjs-connector-web3": {}
}
...
```

### Updating blockchain configurations

Embark 4 adds some new blockchain account configurations. To try to keep things as simple as possible, these additions are really similar to the ones in the Smart Contract configuration. For more information, please read the [Accounts Blockchain configuration guide](/docs/blockchain_accounts_configuration.html) in our docs.

However, we did introduce some small breaking changes. We removed:

- **account**: This is completely replaced by the new accounts property (notice the s at the end of accounts). It gives the developer more flexibility. To have exactly the same behavior as before, just use the `nodeAccounts` account type as described in the docs
- **simulatorMnemonic**: Removed in favor of Ganache’s default mnemonic. If this functionality is still needed, please specify the desired mnemonic in the [blockchain config’s mnemonic account type](/docs/blockchain_accounts_configuration.md#parameter-descriptions).
