/*global contract, config, it, assert*/
const Loops = require('Embark/contracts/Loops');

config({
  contracts: {
    "Loops": {
      args: [1]
    }
  }
});

contract("Loops", function() {
  it("should set constructor value", function(done) {
    Loops.methods.storedData().call().then((result) => {
      assert.strictEqual(parseInt(result, 10), 1);
      done();
    });
  });

  it("set storage value", function(done) {
    Loops.methods.set(5).send().then(() => {
      Loops.methods.get().call().then((result) => {
        assert.strictEqual(parseInt(result, 10), 21);
        done();
      });
    });
  });
});
