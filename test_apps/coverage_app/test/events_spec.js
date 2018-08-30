/*global contract, config, it, assert*/
const Events = require('Embark/contracts/Events');

config({
  contracts: {
    "Events": {
      args: [100]
    }
  }
});

contract("Events", function() {
  it("should deposit", function(done) {
    Events.methods.deposit(10).send().then(() => { done(); });
  });
});
