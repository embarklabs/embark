/*global embark, config, it, web3, before, describe*/
const {__} = require('embark-i18n');
const assert = require('assert');

let gasUsedForDeploy = 0;
let gasPrice = 1;
let accounts;

config({
  blockchain: {
    accounts: [
      // you can configure custom accounts with a custom balance
      // see https://framework.embarklabs.io/docs/contracts_testing.html#Configuring-accounts
      {
        privateKey: "random",
        balance: "10 ether"
      }
    ]
  },
  contracts: {
    deploy: {
      "Token": {
        deploy: false,
        args: [1000]
      },
      "MyToken2": {
        instanceOf: "Token",
        args: [2000]
      },
      "SomeContract": {
        "args": [
          ["$MyToken2", "$accounts[0]"],
          100
        ]
      },
      "SimpleStorage": {
        args: [100]
      }
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

// must be declared outside of the 'before' block, otherwise
// the 'block:header' event does not fire
embark.events.on("block:header", (blockHeader) => {
  gasUsedForDeploy += blockHeader.gasUsed;
});

describe("Account balance", function() {
  before(function(done) {
    embark.events.request("blockchain:gasPrice", (err, blkGasPrice) => {
      if (err) {
        return done(new Error(__("could not get the gas price")));
      }
      gasPrice = parseInt(blkGasPrice, 10);
      done();
    });
  });

  it('should create an account balance from a large ether value in config', async function() {
    const shouldBeWeiBN = web3.utils.toBN('1000000000000000000');
    const actualBalanceWei = await web3.eth.getBalance(accounts[0]);
    const actualBalanceWeiBN = web3.utils.toBN(actualBalanceWei);
    const gasUsedWeiBN = web3.utils.toBN((gasUsedForDeploy * gasPrice).toString());
    const totalBalanceWeiBN = actualBalanceWeiBN.add(gasUsedWeiBN);
    assert.ok(totalBalanceWeiBN.gte(shouldBeWeiBN), "Total balance (account balance + deployment costs) should be greater than or equal to 100K ether");
  });
});
