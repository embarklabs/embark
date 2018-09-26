module.exports = {
  default: {
    deployment: {
      host: "localhost",
      port: 8546,
      type: "ws"
    },
    dappConnection: [
      "$WEB3",
      "ws://localhost:8546",
      "http://localhost:8550",
      "http://localhost:8545",
      "http://localhost:8550"
    ],
    gas: "auto",
    contracts: {
      Ownable: {
        deploy: false,
        onDeploy: ["console.log('===========> onDeploy executed for Ownable')"]
      },
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        onDeploy: [
          "SimpleStorage.methods.setRegistar(web3.eth.defaultAccount).send()",
          "console.log('===========> onDeploy executed for SimpleStorage')"
        ]
      },
      AnotherStorage: {
        args: ["$SimpleStorage"],
        onDeploy: ["console.log('===========> onDeploy executed for AnotherStorage')"]
      },
      Token: {
        deploy: false,
        args: [1000],
        onDeploy: ["console.log('===========> onDeploy executed for Token')"]
      },
      Test: {
        onDeploy: [
          "Test.methods.changeAddress('$MyToken')",
          "console.log('===========> onDeploy executed for Test')"
        ]
      },
      MyToken: {
        instanceOf: "Token",
        onDeploy: ["console.log('===========> onDeploy executed for MyToken')"]
      },
      MyToken2: {
        instanceOf: "Token",
        args: [200],
        onDeploy: ["console.log('===========> onDeploy executed for MyToken2')"]
      },
      AlreadyDeployedToken: {
        address: "0xece374063fe5cc7efbaca0a498477cada94e5ad6",
        instanceOf: "Token",
        onDeploy: ["console.log('===========> onDeploy executed for AlreadyDeployedToken')"]
      },
      MyToken3: {
        instanceOf: "Tokn",
        onDeploy: ["console.log('===========> onDeploy executed for MyToken3')"]
      },
      ContractArgs: {
        args: {
          initialValue: 123,
          "_addresses": ["$MyToken2", "$SimpleStorage"],
          onDeploy: ["console.log('===========> onDeploy executed for ContractArgs')"]
        }
      },
      SomeContract: {
        deployIf: 'await MyToken.methods.isAvailable().call()',
        args: [
          ["$MyToken2", "$SimpleStorage"],
          100
        ],
        onDeploy: ["console.log('===========> onDeploy executed for SomeContract')"]
      },
      ERC20: {
        file: "zeppelin-solidity/contracts/token/ERC20/ERC20.sol",
        onDeploy: ["console.log('===========> onDeploy executed for ERC20')"]
      },
      SimpleStorageTest: {
        file: "./some_folder/test_contract.sol",
        args: [1000],
        onDeploy: ["console.log('===========> onDeploy executed for SimpleStorageTest')"]
      },
      StandardToken: {
        file: "https://github.com/status-im/contracts/blob/151-embark31/contracts/token/StandardToken.sol",
        deploy: false,
        onDeploy: ["console.log('===========> onDeploy executed for StandardToken')"]
      },
      SimpleStorageWithHttpImport: {
        fromIndex: 0,
        args: [100],
        onDeploy: ["console.log('===========> onDeploy executed for SimpleStorageWithHttpImport')"]
      }
    },
    afterDeploy: [
      "Test.methods.changeAddress('$MyToken')",
      "web3.eth.getAccounts((err, accounts) => Test.methods.changeAddress(accounts[0]))",
      "console.log('==========> after deploy executed')"
    ]
  },
  development: {
    contracts: {
      MyToken2: {
        instanceOf: "Token",
        args: [2000],
        onDeploy: ["console.log('===========> onDeploy executed for MyToken2')"]
      }
    }
  },
  infura: {
    deployment: {
      accounts: [
        {
      
          mnemonic: "See https://www.pivotaltracker.com/story/show/160712326 for mnemonic",
          numAddresses: "2"
        }
      ],
      
      host: 'See https://www.pivotaltracker.com/story/show/160712326 for endpoint',
      port: false,
      protocol: 'https',
      type: 'rpc'
    }
  }
};
