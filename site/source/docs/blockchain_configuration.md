title: Blockchain client configuration
layout: docs
---

When in developing, to interact with a blockchain, it is necessary to use a local Ethereum node, either using a simulator or a client like Geth or Parity. In this guide we'll explore how to configure a blockchain client we want Embark to connect to. Embark uses the `blockchain.js` file inside the `./config` folder by default for blockchain related configurations. This [can be configured](/docs/configuration.html#config) to different locations if we want to.

Embark offers a lot of configuration options and most of them already come with a decent default so we can start right away.

## Common Parameters

Here are the common parameters. You will often need only a few of them to make your Embark node work.

If you want more configuration options, you can find them [here](/docs/blockchain_configuration.html#Advanced-parameters)

```
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

Similar to [configuring Smart Contracts](/docs/contracts_configuration.html), this config contains environments that help configuring certain parameters differently depending of the environment. You can read more about [environments here](https://framework.embarklabs.io/docs/environments.html).

### Parameter descriptions

Most of the options are self-explanatory, still, here are some brief descriptions:

Option | Type: `default` | Value
--- | --- | --- 
`enabled` | boolean: `true` | Whether or not to spawn an Ethereum node
`client` | string: `geth` |  Client to use for the Ethereum node. Currently supported: `geth`,  `parity`, `nethermind`, and `quorum`. Note: the corresponding plugin package must be installed in your dApp (ie `embark-quorum`) and the plugin must be enabled in your dApp's `embark.json`, ie `plugins: {  embark-quorum: {} }`
`miningMode` | string: `dev` |  The mining mode to use for the node.<br/>`dev`: This is a special mode where the node uses a development account as defaultAccount. This account is already funded and transactions are faster.<br/>`auto`: Uses a mining script to mine only when needed.<br/>`always`: Miner is always on.<br/>`off`: Turns off the miner
`endpoint` | string |  Endpoint to connect to. Works for external endpoints (like Infura) and local ones too (only for nodes started by `embark run`)
`accounts` | array |  Accounts array for the node and to deploy. When no account is given, defaults to one node account. For more details, go [here](/docs/blockchain_accounts_configuration.html)

## Advanced parameters

Here are all the parameters you can use to customize your node. Note that they all come with defaults that make it that you don't need to specify those.

We recommend putting those inside the `clientConfig` object a better structure.

Option | Type: `default` | Value         
--- | --- | --- 
`rpcHost` | string: `localhost` | Host the RPC server listens to
`rpcPort` | number: `8545` | Port the RPC server listens to
`rpcCorsDomain` | object | The CORS domains the node accepts
`rpcCorsDomain.auto` | | When set to true, Embark checks your other configurations to set the CORS domains. This only adds the required domains.
`rpcCorsDomain.additionalCors` | | Manual list of CORS domains to accept. If `auto` is set to `true`, any URLs specified here will be applied *in addition to* those automatically added with `auto`.
`wsRPC` | boolean: `true` | Whether or not to enable the Websocket server
`wsOrigins` | object | Same as `rpcCorsDomain`, but for the Websocket server
`wsHost` | string: `localhost` | Same as `rpcHost`, but for the Websocket server
`wsPort` | number: `8546` | Same as `rpcPort`, but for the Websocket server
`ethereumClientBin` | string: `geth` |  Path to the client binary. By default, Embark uses the client name as an executable (if it is in the PATH)
`datadir` | string |  Directory where to put the Node's data (eg: keystores)
`networkType` | string: `custom` |  Can be: `testnet`, `rinkeby`, `kovan` or custom, in which case, it will use the specified `networkId`
`networkId` | number: `1337` |  Used when `networkType` is set as `custom`. [List of known network ids](https://github.com/ethereumbook/ethereumbook/blob/3e8cf74eb935d4be495f4306b73de027af95fd97/contrib/devp2p-protocol.asciidoc#known-current-network-ids)
`nodiscover`| boolean: `true` | Disables the peer discovery mechanism when set to `true`
`maxpeers` | number: `0` |  Maximum number of network peers
`proxy` | boolean: `true` | Whether or not Embark should use a proxy to add functionalities. This proxy is used by Embark to see the different transactions that go through, for example, and shows them to you.
`targetGasLimit` | number |  Artificial target gas floor for the blocks to mine
`genesisBlock` | string |  The genesis file to use to create the network. This file is used when creating the network. It tells the client the parameters to initiate the node with. You can read more on [genesis blocks here](https://arvanaghi.com/blog/explaining-the-genesis-block-in-ethereum/)
`tesseraPrivateUrl` | string: `http://localhost:9081` | Endpoint of the Tessera private transaction manager when using `embark-quorum` as the dApp blockchain (`client: 'quorum'` must be set).

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
  clientConfig: {
    miningMode: 'auto',
    genesisBlock: "config/privatenet/genesis.json"
  }
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

Option | Type: `value` | Description         
--- | --- | --- 
`miningMode` | string: `auto` | You need to set `miningMode` to `auto` or `always` so you don't use the development mode
`genesisBlock` | string |  File to start the chain in a clean state for your private network
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
`syncMode` | string |  Blockchain sync mode
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
