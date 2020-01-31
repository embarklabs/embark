module.exports = {
  "default": {
    "versions": {
      "solc": "0.4.26"
    },
    "dappConnection": [
      "$EMBARK",
      "$WEB3",
      "ws://localhost:8546",
      "http://localhost:8550",
      "http://localhost:8545",
      "http://localhost:8550"
    ],
    "gas": "auto",
    "deploy": {
      "Ownable": {
        "deploy": false
      },
      "SimpleStorage": {
        "fromIndex": 0,
        "args": [100]
      },
      "AnotherStorage": {
        "args": [
          "$SimpleStorage",
          "embark.eth"
        ]
      },
      "Token": {
        "deploy": false,
        "args": [1000]
      },
      "Test": {
        "onDeploy": ["Test.methods.changeAddress('$MyToken')"]
      },
      "MyToken": {
        "instanceOf": "Token"
      },
      "MyToken2": {
        "instanceOf": "Token",
        "args": [200]
      },
      "AlreadyDeployedToken": {
        "address": "0xece374063fe5cc7efbaca0a498477cada94e5ad6",
        "instanceOf": "Token"
      },
      "MyToken3": {
        "instanceOf": "Tokn"
      },
      "ContractArgs": {
        "args": {
          "initialValue": 123,
          "_addresses": ["$MyToken2", "$SimpleStorage"]
        }
      },
      "SomeContract": {
        "args": [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      }
    },
    afterDeploy: async ({contracts, web3}) => {
      await contracts.Test.methods.changeAddress(contracts.MyToken.options.address).send();
      const accounts = await web3.eth.getAccounts();
      await contracts.Test.methods.changeAddress(accounts[0]).send();
    }
  },
  "development": {
    "deploy": {
      "MyToken2": {
        "instanceOf": "Token",
        "args": [2000]
      }
    }
  }
};
