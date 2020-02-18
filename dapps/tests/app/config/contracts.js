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
    interfaces: ['Ownable'],
    deploy: {
      Token: {
        deploy: false,
        args: [1000]
      },
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        onDeploy: ["SimpleStorage.methods.setRegistar('embark.eth').send()"]
      },
      SimpleStorageArgsFn: {
        instanceOf: 'SimpleStorage',
        args: async ({ contracts, web3, logger }) => {
          return [5000];
        }
      },
      SimpleStorageTest: {
        //file: "./some_folder/test_contract.sol",
        args: [1000, 'embark.eth']
      },
      StandardToken: {
        file: "https://github.com/status-im/contracts/blob/151-embark31/contracts/token/StandardToken.sol",
        deploy: false
      },
      AnotherStorage: {
        args: ["$SimpleStorage"]
        //args: ["0x0000000000000000000000000000000000000000"]
      },
      BigFreakingContract: {
        args: [100]
      },
      ContractArgs: {
        args: {
          initialValue: 123,
          _addresses: ["$MyToken2", "$SimpleStorage"]
        }
      },
      SomeContract: {
        deployIf: 'await MyToken.methods.isAvailable().call()',
        deps: ['MyToken'],
        args: [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      },
      Expiration: {
        args: [1000]
      },
      SimpleStorageWithHttpImport: {
        fromIndex: 0,
        args: [100]
      },
      MyToken: {
        instanceOf: "Token"
      },
      MyToken2: {
        instanceOf: "Token",
        args: [200]
      },
    },
    afterDeploy: async (dependencies) => {
      console.log("==========================");
      console.log("after deploying contracts");
      console.log("==========================");
      // console.dir(dependencies);
      // console.dir(dependencies.contracts.SimpleStorage.methods);
      // try {
      //   let value = await dependencies.contracts.SimpleStorage.methods.get().call();
      //   console.dir(value)
      // } catch(err) {
      //   console.dir(err);
      // }
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
