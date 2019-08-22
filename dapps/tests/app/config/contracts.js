module.exports = {
  default: {
    dappConnection: [
      "$EMBARK",
      "ws://localhost:8546",
      "$WEB3"
    ],
    gas: "auto",
    beforeDeploy: async () => {
      console.log("==========================");
      console.log("before deploying contracts");
      console.log("==========================");
    },
    deploy: {
      Ownable: {
        deploy: false
      },
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        onDeploy: ["SimpleStorage.methods.setRegistar('embark.eth').send({from: web3.eth.defaultAccount})"]
      },
      SimpleStorageTest: {
        //file: "./some_folder/test_contract.sol",
        args: [1000, 'embark.eth']
      },
      AnotherStorage: {
        args: ["$SimpleStorage"]
        //args: ["0x0000000000000000000000000000000000000000"]
      }
    },
    afterDeploy: async (dependencies) => {
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("after deploying contracts");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      console.log("==========================");
      // console.dir(dependencies);
      // console.dir(dependencies.contracts.SimpleStorage.methods);
      // try {
      //   let value = await dependencies.contracts.SimpleStorage.methods.get().call();
      //   console.dir(value)
      // } catch(err) {
      //   console.dir(err);
      // }
      console.log("==========================");
    }
    //afterDeploy: [
    //"Test.methods.changeAddress('$MyToken')",
    //"web3.eth.getAccounts((err, accounts) => Test.methods.changeAddress(accounts[0]))"
    //]
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
