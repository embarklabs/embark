/*global artifacts, contract, config, it*/
const assert = require('assert');
const SimpleStorage = artifacts.require('SimpleStorage');

config({
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      }
    }
  }
});

contract("SimpleStorage", function () {
  it("should set constructor value", async function () {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", async function () {
    this.timeout(0);
    const toSend = SimpleStorage.methods.set(150);
    const gas = await toSend.estimateGas();
    await toSend.send({gas});
    let result = await SimpleStorage.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 499650);
  });
});
