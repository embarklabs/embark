/*global contract, config, it, assert, mineAtTimestamp*/
const Expiration = require('Embark/contracts/Expiration');
const now = Math.floor(new Date().getTime()/1000.0); // Get unix epoch. The getTime method returns the time in milliseconds.

config({
  contracts: {
    deploy: {
      "Expiration": {
        args: [now + 1000]
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
    await mineAtTimestamp(now + 1001); // sets block.timestamp to 1001
    const isExpired = await Expiration.methods.isExpired().call();
    assert.strictEqual(isExpired, true);
  });
});
