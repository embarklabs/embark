module.exports = {
  default: {
    dappConnection: [
      "ws://localhost:8546",
      "http://localhost:8550",
      "http://localhost:8545",
      "http://localhost:8550",
      "$WEB3"
    ],
    gas: "auto",
    deploy: {
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        onDeploy: ["SimpleStorage.methods.setRegistar(web3.eth.defaultAccount).send()"]
      },
   },
    afterDeploy: [
      //"Test.methods.changeAddress('$MyToken')",
      //"web3.eth.getAccounts((err, accounts) => Test.methods.changeAddress(accounts[0]))"
    ]
  },
  development: {
    deploy: {
      // MyToken2: {
      //   instanceOf: "Token",
      //   args: [2000]
      // }
    }
  }
};
