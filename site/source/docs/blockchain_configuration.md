title: Blockchain client configuration
layout: docs
---

When in developing, to interact with a blockchain, it is necessary to use a local Ethereum node, either using a simulator or a client like Geth or Parity. In this guide we'll explore how to configure a blockchain client we want Embark to connect to. Embark uses the `blockchain.js` file inside the `./config` folder by default for blockchain related configurations. This [can be configured](/docs/configuration.html#config) to different locations if we want to.

Embark offers a lot of configuration options and most of them already come with a decent default so we can start right away.

## Common Parameters

Here are the common parameters. Again, most of them come with a decent default so don't get too overwhelmed by the amount of options available:

```
module.exports = {
  default: {
    enabled: true,
    rpcHost: "localhost",
    rpcPort: 8545,
    rpcCorsDomain: {
      auto: true,
      additionalCors: ['localhost:9999']
    },
    wsRPC: true,
    wsOrigins: {
      auto: true,
      additionalCors: []
    },
    wsHost: "localhost", 
    wsPort: 8546
  },
  development: {
    ethereumClientName: "geth",
    ethereumClientBin: "geth",
    datadir: ".embark/development/datadir",
    networkType: "custom",
    networkId: 1337,
    isDev: true,
    nodiscover: true,
    maxpeers: 0,
    proxy: true,
    targetGasLimit: 8000000
  }
}
```

Similar to [configuring Smart Contracts](/docs/contracts_configuration.html), this config contains environments that help configuring certain parameters differently depending of the environment. You can read more about [environments here](https://embark.status.im/docs/environments.html).

### Parameter descriptions

Most of the options are self-explanatory, still, here are some brief descriptions.

Option | Type: `default` | Value         
--- | --- | --- 
`enabled` | boolean: `true` | Whether or not to spawn an Ethereum node
`rpcHost` | string: `localhost` | Host the RPC server listens to
`rpcPort` | number: `8545` | Port the RPC server listens to
`rpcCorsDomain` | object | The CORS domains the node accepts
`rpcCorsDomain.auto` | | When set to true, Embark checks your other configurations to set the CORS domains. This only adds the required domains.
`rpcCorsDomain.additionalCors` | | Manual list of CORS domains to accept. If `auto` is set to `true`, any URLs specified here will be applied *in addition to* those automatically added with `auto`.
`wsRPC` | boolean: `true` | Whether or not to enable the Websocket server
`wsOrigins` | object | Same as `rpcCorsDomain`, but for the Websocket server
`wsHost` | string: `localhost` | Same as `rpcHost`, but for the Websocket server
`wsPort` | number: `8546` | Same as `rpcPort`, but for the Websocket server
`ethereumClientName` | string: `geth` |  Client to use for the Ethereum node. Currently supported: `geth` and `parity`
`ethereumClientBin` | string: `geth` |  Path to the client binary. By default, Embark uses the client name as an executable (if it is in the PATH)
`datadir` | string |  Directory where to put the Node's data (eg: keystores)
`networkType` | string: `custom` |  Can be: `testnet`, `rinkeby`, `kovan` or custom, in which case, it will use the specified `networkId`
`networkId` | number: `1337` |  Used when `networkType` is set as `custom`. [List of known network ids](https://github.com/ethereumbook/ethereumbook/blob/3e8cf74eb935d4be495f4306b73de027af95fd97/contrib/devp2p-protocol.asciidoc#known-current-network-ids)
`isDev` | boolean: `true` |  Whether or not to use the development mode of the Node. This is a special mode where the node uses a development account as defaultAccount. This account is already funded and transactions are faster. It is recommended to start by using `isDev: true` for you project, as it is faster and safer
`nodiscover`| boolean: `true` | Disables the peer discovery mechanism when set to `true`
`maxpeers` | number: `0` |  Maximum number of network peers
`proxy` | boolean: `true` | Whether or not Embark should use a proxy to add functionalities. This proxy is used by Embark to see the different transactions that go through, for example, and shows them to you.
`targetGasLimit` | number |  Artificial target gas floor for the blocks to mine

{% notification info 'Using Parity and Metamask' %}

Parity has very strict CORS policies. In order to use it with Metamask (or any other browser extension), you need to add the extension's URL in the CORS.

You can do so by opening Metamask in its own tab. Then, copy the URL. It will look something like `chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn`.

Afterwards, in your blockchain config, add it to `additionalCors` of `rpcCorsDomain` and `wsOrigins`.
{% endnotification %}

## Privatenet configuration

A private network is really similar to using the development mode of a client. The biggest differences is that it does not come with a default pre-funded account and it will not use POA (proof of authority), meaning that blocks will need to be mined.

Luckily, Embark has settings to limit the mining to a minimum so that everything can run smoothly while testing in a more realistic environment before going to a test network.

### Privatenet parameters

Here are common parameters for private net configurations:
```
privatenet: {
  networkType: "custom",
  networkId: 1337,
  isDev: false,
  datadir: ".embark/privatenet/datadir",
  mineWhenNeeded: true, 
  genesisBlock: "config/privatenet/genesis.json",
  nodiscover: true,
  maxpeers: 0,
  proxy: true,
  accounts: [
    {
      nodeAccounts: true,
      password: "config/privatenet/password"
    }
  ]
}
```

Note that we can always use the parameters we saw in the [Common parameters section](#Common-Parameters) to override the `default` parameters.

### Parameter descriptions

Option | Type: `default` | Value         
--- | --- | --- 
`isDev` | boolean: `false` | You need to set `isDev` to false to use enable any network that isn't the development one
`datadir` | string |  Behaves the same way as stated above, but it is recommended to use a different for different networks
`mineWhenNeeded` | boolean: `true` | Whether to always mine (`false`) or only mine when there is a transaction (`true`). It is recommended to set `mineWhenNeeded` to `true` as otherwise, you CPU will get massively used.
`genesisBlock` | string |  The genesis file to use to create the network. This file is used when creating the network. It tell the client the parameters to initiate the node with. You can read more on [genesis blocks here](https://arvanaghi.com/blog/explaining-the-genesis-block-in-ethereum/)
`accounts` | array |  Array of accounts to connect to. Go to the [Accounts configuration](/docs/blockchain_accounts_configuration.html) page to learn more on accounts


## Testnet configuration

Test networks are networks that are public. Knowing that, if we want to connect to a node that we control, we will first need to synchronize it. This can take hours, as we need to download the blocks that we are missing from the other peers.

The big advantage of using a local synced node is that we have control over it and it preserves our privacy, as we aren't using a third party node. However, as mentioned, it takes a lot of time to synchronize a node and also requires a lot of computer resources, so keep it in mind if you want to go down that route.

### Testnet parameters

```
testnet: {
  networkType: "testnet",
  syncMode: "light",
  accounts: [
    {
      nodeAccounts: true,
      password: "config/testnet/password"
    }
  ]
}
```

Here are the necessary parameters. Again, we can add more to override as you see fit.

### Parameter descriptions

Option | Type: `default` | Value         
--- | --- | --- 
`networkType` | string: `testnet` | Again, used to specify the network. `testnet` here represents Ropsten. You can change the network by using a `networkId` by changing `networkType` to `custom`
`syncMode` | string |  Blockhain sync mode
`syncMode = 'light' `| |  Light clients synchronize a bare minimum of data and fetch necessary data on-demand from the network. Much lower in storage, potentially higher in bandwidth
`syncMode = 'fast'` | | Faster, but higher store
`syncMode = 'full'`| | Normal sync
`accounts` | array |  Array of accounts to connect to.  Go to the [Accounts configuration](/docs/blockchain_accounts_configuration.html) page to learn more on accounts


## Mainnet configuration

Finally, the main network, a.k.a. mainnet. It may come as no surprise, but to sync to the mainnet, the step and configurations are actually the same as for a [test network](#Testnet-configuration). The only major difference is that the `networkType` needs to be `custom` with the `networkId` set to `1`.

```
mainnet: {
  networkType: "custom",
  networkId: 1,
  syncMode: "light",
  accounts: [
    {
      nodeAccounts: true,
      password: "config/mainnet/password"
    }
  ]
}
```

