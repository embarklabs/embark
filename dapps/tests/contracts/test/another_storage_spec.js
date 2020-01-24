/*global artifacts, contract, config, it*/
const assert = require('assert');
const AnotherStorage = artifacts.require('AnotherStorage');
const SimpleStorage = artifacts.require('SimpleStorage');
let accounts;

config({
  namesystem: {
    enabled: true
  },
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage", "embark.eth"]
      }
    }
  }
}, (err, accs) => {
  accounts = accs;
});

contract("AnotherStorage", function() {
  this.timeout(0);

  it("set SimpleStorage address", async function() {
    const result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

  it("set ENS address", async function() {
    const result = await AnotherStorage.methods.ens().call();
    assert.equal(result.toString(), accounts[0]);
  });
});
