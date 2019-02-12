/*global contract, config, it*/
const assert = require('assert');
const Test2 = require('Embark/contracts/Test2');

config({
  contracts: {
    "Test2": {
    },
    "ZAMyLib": {
    },
    "ZAMyLib2": {
      "deploy": true
    }
  }
});

contract("Test", function() {
  it("should call library correctly", async function() {
    let result = await Test2.methods.testAdd().call();
    assert.strictEqual(parseInt(result, 10), 3);
  });

});
