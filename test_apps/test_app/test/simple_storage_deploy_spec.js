/*global contract, it, embark, assert, before, web3*/
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');
const Utils = require('embarkjs').Utils;

contract("SimpleStorage Deploy", function () {
  let simpleStorageInstance;
  before(function(done) {
    Utils.secureSend(web3, SimpleStorage.deploy({arguments: [150]}), {}, true, function(err, receipt) {
      if(err) {
        return done(err);
      }
      simpleStorageInstance = SimpleStorage;
      simpleStorageInstance.options.address = receipt.contractAddress;
      done();
    });
  });

  it("should set constructor value", async function () {
    let result = await simpleStorageInstance.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });

  it("set storage value", function (done) {
    Utils.secureSend(web3, simpleStorageInstance.methods.set(200), {}, false, async function(err) {
      if (err) {
        return done(err);
      }
      let result = await simpleStorageInstance.methods.get().call();
      assert.strictEqual(parseInt(result, 10), 200);
      done();
    });
  });

});
