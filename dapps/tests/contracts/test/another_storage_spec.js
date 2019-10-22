/*global contract, config, it*/
const assert = require('assert');
const AnotherStorage = require('Embark/contracts/AnotherStorage');
const SimpleStorage = require('Embark/contracts/SimpleStorage');
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
      // "AnotherStorage": {
      //   args: ["$SimpleStorage", "embark.eth"]
      // },
      "AnotherStorage": {
        args: ["$SimpleStorage", "$SimpleStorage"]
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

  // FIXME add back when the ENS feature is back
  xit("set ENS address", async function() {
    const result = await AnotherStorage.methods.ens().call();
    assert.equal(result.toString(), accounts[0]);
  });
});
