/*global contract, config, it, assert*/
const Modifiers = require('Embark/contracts/Modifiers');

config({
  contracts: {
    "Modifiers": {
      args: [100]
    }
  }
});

contract("Modifiers", function() {
  it("should set constructor value", function(done) {
    Modifiers.methods.storedData().call().then((result) => {
      assert.strictEqual(parseInt(result, 10), 100);
      done();
    });
  });

  it("set storage value when valid", function(done) {
    Modifiers.methods.set(150).send().then(() => {
      Modifiers.methods.get().call().then((result) => {
        assert.strictEqual(parseInt(result, 10), 150);
        done();
      });
    });
  });

  it("refuses storage value when invalid", function(done) {
    Modifiers.methods.set(10000).send().catch((_err) => {
      done();
    });
  });
});
