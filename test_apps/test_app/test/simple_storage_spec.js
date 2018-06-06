/*global contract, config, it, embark*/
const assert = require('assert');
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');

config({
  contracts: {
    "SimpleStorage": {
      args: [100],
      onDeploy: [
        "SimpleStorage.methods.setRegistar(web3.eth.defaultAccount).send()"
      ]
    }
  }
});

contract("SimpleStorage", function () {
  this.timeout(0);

  it("should set constructor value", async function () {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", async function () {
    await SimpleStorage.methods.set(150).send();
    let result = await SimpleStorage.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 499650);
  });

  it("should set defaultAccount", async function () {
    let result = await SimpleStorage.methods.registar().call();
    assert.strictEqual(result, web3.eth.defaultAccount);
  });

});
