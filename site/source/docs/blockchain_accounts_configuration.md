title: Accounts Blockchain configuration
layout: docs
---

In our [guide on configuring a blockchain client](/docs/blockchain_configuration.html), we've configured accounts in several places.

This parameter let's us customize what the `accounts` will be for our deployment, as well as the accounts that will be created and unlocked by our blockchain client.

## Accounts parameters

```
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
```

The `accounts` configuration is an array of objects, where each object represents one or more account.

Embark offers you multiple ways to include your account. You can use the one you prefer and ignore the others or mix and match.

{% notification danger 'Using production keys' %}
Be careful when using production keys and mnemonics (ie the account where you have real money).

We recommend using [environment variables](https://www.schrodinger.com/kb/1842) for plain text values like `privateKey` and `mnemonic` and to put the files for `privateKeyFile` and key stores either out of your working directory or ignored by versioning (eg: add the file in gitignore)
{% endnotification %}

### Parameter descriptions

- **nodeAccounts**: The actual node accounts, that get created and unlocked by the client
  - Can be enabled by setting it to `true`
  - **numAddresses**: Number of addresses you want from the node. Defaults to `1`
  - **password**: Password file where the password to create and unlock the accounts is. This is required
- **privateKey**: Private key string
- **privateKeyFile**: Either a file containing comma separated private keys or a keystore (password needed for the latter)
  - **password**: Password string for the keystore
- **mnemonic**: 12 word mnemonic
  - **addressIndex**: Index where to start getting the addresses. Defaults to `0`
  - **numAddresses**: Number of addresses to get. Defaults to `1`
  - **hdpath**: HD derivation path. Defaults to `"m/44'/60'/0'/0/"`

{% notification info 'Old parameters' %}
Please note, `account` has been replaced by `nodeAccounts` and `simulatorMnemonic` by adding a `mnemonic` account in the `accounts` array
{% endnotification %}
