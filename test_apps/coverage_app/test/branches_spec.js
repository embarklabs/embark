/*global contract, config, it, assert*/
const Branches = require('Embark/contracts/Branches');

config({
  contracts: {
    "Branches": {
      args: [5]
    }
  }
});

contract("Branches", function() {
  it("should return the bigger value and set it", function(done) {
    Branches.methods.bigger(10).send().then(() => {
      Branches.methods.get().call().then((result) => {
        assert.strictEqual(parseInt(result, 10), 10);
        done();
      });
    });
  });

  it("should return the set number if it's bigger", function(done) {
    Branches.methods.bigger(1).send().then(() => {
      done();
    });
  });

  it("should return the smaller number", function(done) {
    Branches.methods.smaller(10).send().then(() => { done() });
  });
});
