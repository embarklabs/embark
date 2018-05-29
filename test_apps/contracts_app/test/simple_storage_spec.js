/*global contract, before, it, embark, web3*/
const assert = require('assert');
const SimpleStorage = embark.require('contracts/SimpleStorage');

contract("SimpleStorage", function () {
  this.timeout(0);

  before(function (done) {
    const contractsConfig = {
      contracts: {
        "SimpleStorage": {
          args: [100]
        }
      }
    };
    embark.config(contractsConfig, () => {
      done();
    });
  });

  it("should set constructor value", async function () {
    let result = await SimpleStorage.contract.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", async function () {
    // TODO Solve from
    await SimpleStorage.contract.methods.set(150).send({from: web3.eth.defaultAccount});
    let result = await SimpleStorage.contract.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 499650);
  });

});
