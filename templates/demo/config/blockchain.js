module.exports = {
  // applies to all environments
  default: {
    enabled: true,
    rpcHost: "localhost", // HTTP-RPC server listening interface (default: "localhost")
    rpcPort: 8545, // HTTP-RPC server listening port (default: 8545)
    rpcCorsDomain: { // Domains from which to accept cross origin requests (browser enforced). This can also be a comma separated list
      auto: true, // When "auto" is true, Embark will automatically set the cors to the address of the webserver
      additionalCors: [] // Additional CORS domains to add to the list. If "auto" is false, only those will be added
    },
    wsRPC: true, // Enable the WS-RPC server
    wsOrigins: { // Same thing as "rpcCorsDomain", but for WS origins
      auto: true,
      additionalCors: []
    },
    wsHost: "localhost", // WS-RPC server listening interface (default: "localhost")
    wsPort: 8546 // WS-RPC server listening port (default: 8546)

    // Accounts to use as node accounts
    // The order here corresponds to the order of `web3.eth.getAccounts`, so the first one is the `defaultAccount`
    /*,accounts: [
      {
        nodeAccounts: true, // Accounts use for the node
        numAddresses: "1", // Number of addresses/accounts (defaults to 1)
        password: "config/development/devpassword" // Password file for the accounts
      },
      // Below are additional accounts that will count as `nodeAccounts` in the `deployment` section of your contract config
      // Those will not be unlocked in the node itself
      {
        privateKey: "your_private_key"
      },
      {
        privateKeyFile: "path/to/file", // Either a keystore or a list of keys, separated by , or ;
        password: "passwordForTheKeystore" // Needed to decrypt the keystore file
      },
      {
        mnemonic: "12 word mnemonic",
        addressIndex: "0", // Optional. The index to start getting the address
        numAddresses: "1", // Optional. The number of addresses to get
        hdpath: "m/44'/60'/0'/0/" // Optional. HD derivation path
      }
    ]*/
  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run` and `embark blockchain`
  development: {
    ethereumClientName: "geth", // Can be geth or parity (default:geth)
    //ethereumClientBin: "geth",  // path to the client binary. Useful if it is not in the global PATH
    networkType: "custom", // Can be: testnet, rinkeby, livenet or custom, in which case, it will use the specified networkId
    networkId: 1337, // Network id used when networkType is custom
    isDev: true, // Uses and ephemeral proof-of-authority network with a pre-funded developer account, mining enabled
    datadir: ".embark/development/datadir", // Data directory for the databases and keystore (Geth 1.8.15 and Parity 2.0.4 can use the same base folder, till now they does not conflict with each other)
    mineWhenNeeded: true, // Uses our custom script (if isDev is false) to mine only when needed
    nodiscover: true, // Disables the peer discovery mechanism (manual peer addition)
    maxpeers: 0, // Maximum number of network peers (network disabled if set to 0) (default: 25)
    proxy: true, // Proxy is used to present meaningful information about transactions
    targetGasLimit: 8000000, // Target gas limit sets the artificial target gas floor for the blocks to mine
    simulatorBlocktime: 0 // Specify blockTime in seconds for automatic mining. Default is 0 and no auto-mining.
  },

  // merges with the settings in default
  // used with "embark run privatenet" and/or "embark blockchain privatenet"
  privatenet: {
    networkType: "custom",
    networkId: 1337,
    isDev: false,
    datadir: ".embark/privatenet/datadir",
    // -- mineWhenNeeded --
    // This options is only valid when isDev is false. 
    // Enabling this option uses our custom script to mine only when needed.
    // Embark creates a development account for you (using `geth account new`) and funds the account. This account can be used for
    // development (and even imported in to MetaMask). To enable correct usage, a password for this account must be specified
    // in the `account > password` setting below.
    // NOTE: once `mineWhenNeeded` is enabled, you must run an `embark reset` on your dApp before running
    // `embark blockchain` or `embark run` for the first time.
    mineWhenNeeded: true,
    // -- genesisBlock --
    // This option is only valid when mineWhenNeeded is true (which is only valid if isDev is false).
    // When enabled, geth uses POW to mine transactions as it would normally, instead of using POA as it does in --dev mode.
    // On the first `embark blockchain or embark run` after this option is enabled, geth will create a new chain with a
    // genesis block, which can be configured using the `genesisBlock` configuration option below.
    genesisBlock: "config/privatenet/genesis.json", // Genesis block to initiate on first creation of a development node
    nodiscover: true,
    maxpeers: 0,
    proxy: true,
    accounts: [
      {
        nodeAccounts: true,
        password: "config/privatenet/password" // Password to unlock the account
      }
    ],
    targetGasLimit: 8000000,
    simulatorBlocktime: 0
  },

  privateparitynet: {
    ethereumClientName: "parity",
    networkType: "custom",
    networkId: 1337,
    isDev: false,
    genesisBlock: "config/privatenet/genesis-parity.json", // Genesis block to initiate on first creation of a development node
    datadir: ".embark/privatenet/datadir",
    mineWhenNeeded: false,
    nodiscover: true,
    maxpeers: 0,
    proxy: true,
    accounts: [
      {
        nodeAccounts: true,
        password: "config/privatenet/password"
      }
    ],
    targetGasLimit: 8000000,
    simulatorBlocktime: 0
  },

  // merges with the settings in default
  // used with "embark run testnet" and/or "embark blockchain testnet"
  testnet: {
    networkType: "testnet",
    syncMode: "light",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/testnet/password"
      }
    ]
  },

  // merges with the settings in default
  // used with "embark run livenet" and/or "embark blockchain livenet"
  livenet: {
    networkType: "livenet",
    syncMode: "light",
    rpcCorsDomain: "http://localhost:8000",
    wsOrigins: "http://localhost:8000",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/livenet/password"
      }
    ]
  }

  // you can name an environment with specific settings and then specify with
  // "embark run custom_name" or "embark blockchain custom_name"
  //custom_name: {
  //}
};
