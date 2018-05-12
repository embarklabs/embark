module.exports = {
  // default applies to all enviroments
  default: {
    // rpc to deploy the contracts
    deployment: {
      host: "localhost",
      port: 8545,
      type: "rpc"
    },
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "http://localhost:8545"
    ],
    gas: "auto",
    contracts: {
      // example:
      //SimpleStorage: {
      //  args: [ 100 ]
      //}
    }
  }
}
