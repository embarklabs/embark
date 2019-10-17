/*global contract, config, it, assert, increaseTime*/
const Expiration = require('Embark/contracts/Expiration');

config({
  contracts: {
    deploy: {
      "Expiration": {
        args: [Date.now() + 5000]
      }
    }
  }
});

contract("Expiration", function() {
  it("should not have expired yet", async function () {
    const isExpired = await Expiration.methods.isExpired().call();
    assert.strictEqual(isExpired, false);
  });

  it("should have expired after skipping time", async function () {
    await increaseTime(5001);
    const isExpired = await Expiration.methods.isExpired().call();
    assert.strictEqual(isExpired, true);
  });
});
