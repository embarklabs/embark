module.exports = {
  // applies to all environments
  default: {
    enabled: true,
    rpcHost: "localhost", // HTTP-RPC server listening interface (default: "localhost")
    rpcPort: 8545, // HTTP-RPC server listening port (default: 8545)
    rpcCorsDomain: "auto",  // Comma separated list of domains from which to accept cross origin requests (browser enforced)
                            // When set to "auto", Embark will automatically set the cors to the address of the webserver
    wsRPC: true, // Enable the WS-RPC server
    wsOrigins: "auto",  // Origins from which to accept websockets requests
                        // When set to "auto", Embark will automatically set the cors to the address of the webserver
    wsHost: "localhost", // WS-RPC server listening interface (default: "localhost")
    wsPort: 8546 // WS-RPC server listening port (default: 8546)
  },
  development: {
    networkType: "custom", // Can be: testnet, rinkeby, livenet or custom, in which case, it will use the specified networkId
    networkId: "1337", // Network id used when networkType is custom
    isDev: true, // Uses and ephemeral proof-of-authority network with a pre-funded developer account, mining enabled
    datadir: ".embark/development/datadir", // Data directory for the databases and keystore
    mineWhenNeeded: true, // Uses our custom script (if isDev is false) to mine only when needed
    nodiscover: true, // Disables the peer discovery mechanism (manual peer addition)
    maxpeers: 0, // Maximum number of network peers (network disabled if set to 0) (default: 25)
    proxy: true, // Proxy is used to present meaningful information about transactions
    targetGasLimit: 8000000, // Target gas limit sets the artificial target gas floor for the blocks to mine
    simulatorMnemonic: "example exile argue silk regular smile grass bomb merge arm assist farm", // Mnemonic  used by the simulator to generate a wallet
    simulatorBlocktime: 0 // Specify blockTime in seconds for automatic mining. Default is 0 and no auto-mining.
  },
  privatenet: {
    networkType: "custom",
    networkId: "1337",
    isDev: false,
    genesisBlock: "config/privatenet/genesis.json", // Genesis block to initiate on first creation of a development node
    datadir: ".embark/privatenet/datadir",
    mineWhenNeeded: true,
    nodiscover: true,
    maxpeers: 0,
    proxy: true,
    account: {
      // "address": "", // When specified, uses that address instead of the default one for the network
      password: "config/privatenet/password" // Password to unlock the account
    },
    targetGasLimit: 8000000,
    wsHost: "localhost",
    wsPort: 8546,
    simulatorMnemonic: "example exile argue silk regular smile grass bomb merge arm assist farm",
    simulatorBlocktime: 0
  },
  testnet: {
    networkType: "testnet",
    syncMode: "light",
    account: {
      password: "config/testnet/password"
    }
  },
  livenet: {
    networkType: "livenet",
    syncMode: "light",
    rpcCorsDomain: "http://localhost:8000",
    wsOrigins: "http://localhost:8000",
    account: {
      password: "config/livenet/password"
    }
  }
};
