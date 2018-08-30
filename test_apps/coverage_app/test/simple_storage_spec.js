/*global contract, config, it, assert*/
const SimpleStorage = require('Embark/contracts/SimpleStorage');

config({
  contracts: {
    "SimpleStorage": {
      args: [100]
    }
  }
});

contract("SimpleStorage", function() {
  it("should set constructor value", function(done) {
    SimpleStorage.methods.storedData().call().then((result) => {
      assert.strictEqual(parseInt(result, 10), 100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.methods.set(150).send().then(() => {
      SimpleStorage.methods.get().call().then((result) => {
        assert.strictEqual(parseInt(result, 10), 150);
        done();
      });
    });
  });
});
