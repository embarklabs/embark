title: Accounts & Deployment
layout: docs
---

Embark is very flexible when it comes to configuring wallet accounts for deployment. Whether we want to deploy from generated node accounts, or our own key store file. In this guide we'll take a closer look at how to configure wallet accounts for deployment of Smart Contracts. 

## Specifying a deployment account

We can specify from which account we want to deploy a Smart Contract using the `from` or `fromIndex` options of a Smart Contract's configuration. The `from` parameter is a string which can be any account address:

```
...
contracts: {
  Currency: {
    from: '0xfeedaa0e295b09cd84d6ea2cce390eb443bcfdfc',
    args: [100]
  }
}
...
```

`fromIndex` on the other hand, configures the index of the accounts array that is returned by `web3.eth.getAccounts()`. The following code configures the `Currency` Smart Contract to deployed from the first address:


```
...
contracts: {
  Currency: {
    fromIndex: 0
    args: [100]
  }
}
...
```

If both options are configured, `from` takes precedence.

## Using wallet accounts

We can use our own wallet accounts by specifying either a private key, a mnemonic, or a private key file. Let's take a look at how this is done.

{% notification danger 'A note on private keys in production' %}

While it's very convenient to put private keys, passphrases and mnemonics in the configuration file, we highly recommend doing this only sparingly and ideally move sensitive data into environment variables instead.

Please consider the following configuration options as development-only options and refer to [using environment variables for production](#Using-environment-variables-for-production), once you plan to deploy your application on Mainnet.

{% endnotification %}

### Using a private key

Using a private key is just a matter of adding it as `privateKey` option.

```
module.exports = {
  testnet: {
    deployment: {
      accounts: [
        {
          privateKey: "your_private_key"
        }
      ]
    }
  }
}
```

This can also be set to `random` to generate a random account (useful when testing):

```
privateKey: "random"
```

### Using a private key store

Another option is to use an existing private key store file. Instead of writing the private key straight into the configuration file, we specify a path to a private key store file using the `privateKeyFile` option. Key store files need to be decrypted using a passphrase. That's why `privateKeyFile` needs to be used in combination with the `password` option, which is the passphrase needed to unlock the key store file:

```
module.exports = {
  testnet: {
    deployment: {
      accounts: [
        {
          privateKeyFile: 'path/to/key/store/file',
          password: 'some super secret password'
        }
      ]
    }
  }
}
```

### Using a Mnemonic

Last but not least it's also possible to use a mnemonic to generate a wallet and specify which of the wallet's addresses should be used for deployment. It's also possible to configure an HD derivation path if more control is needed.

```
module.exports = {
  testnet: {
    deployment: {
      accounts: [
        {
          mnemonic: "12 word mnemonic",
          addressIndex: "0", // Optional. The index to start getting the address
          numAddresses: "1", // Optional. The number of addresses to get
          hdpath: "m/44'/60'/0'/0/" // Optional. HD derivation path
        }
      ]
    }
  }
}
```

## Using node accounts

Some blockchain node clients such as Geth allow for generating accounts. This is very useful for development purposes. We can tell Embark to make use of those accounts, by using the `nodeAccounts` option and setting it to `true`.

In addition to that, we can combine the generated node accounts with our own custom accounts, simply by extending the `accounts` array with any of the configurations covered earlier:

```
module.exports = {
  testnet: {
    deployment: {
      accounts: [
        {
          nodeAccounts: true
        },
        {
          privateKey: '...'
        }
      ]
    }
  }
}
```

{% notification info 'Accounts order' %}
The order in the accounts array is important. This means that using `nodeAccounts` first, as above, will set the node's account as the `defaultAccount` for deployment.
{% endnotification %}

## Using environment variables for production

There are special security considerations to have when deploying to production. Chiefly, no private keys, private key files or mnemonics should be present in source control. Instead, we recommend using environment variables to pass those values in, like this:

```
const secrets = require('secrets.json'); // should NOT be in source control

module.exports = {
  mainnet: {
    deployment: {
      accounts: [
        {
          privateKeyFile: secrets.privateKeyFilePath,
          password: secrets.password
        },
        {
          mnemonic: process.env.DAPP_MNEMONIC, // An environment variable is also possible
          addressIndex: "0", // Optional. The index to start getting the address
          numAddresses: "1", // Optional. The number of addresses to get
          hdpath: "m/44'/60'/0'/0/" // Optional. HD derivation path
        }
      ]
    }
  }
}
```

## Configuring account balance for development
When in development, we can specify the balance of each account using the `balance` option:

```
module.exports = {
  development: {
      deployment: {
        accounts: [
          {
            mnemonic: "12 word mnemonic",
            balance: "5 ether"
          }
        ]
      }
  }
}
```

Balances are specified using a [human readable units](/docs/contracts_configuration.html#Human-readable-Ether-units) such as "5 ether" or "200 finney". If no unit is specified the value will be in Wei.

## Using accounts in arguments

Account can be used as arguments using Embark's built-in interpolation syntax, similar to referring to Smart Contract instances.

```
module.exports = {
  development: {
    contracts: {
      MyContractThatNeedsAccountAddresses: {
        args: ['$accounts[0]', '$accounts[4]']
      }
    }
  }
}
```

## Deploying to Infura

We can also connect to a remote Infura.io blockchain node as per instructions below. The following specifies the configuration for the web3 provider, not the blockchain node configuration itself.

```
module.exports = {
  testnet: {
    deployment:{
      accounts: [
        {
         // your accounts here, see above for details
        }
      ],
      host: "rinkeby.infura.io/INFURA_TOKEN_HERE",
      port: false,
      protocol: 'https',
      type: "rpc"
    }
  }
}
```

