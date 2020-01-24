/*global artifacts, contract, config, it*/
const assert = require('assert');
const AnotherStorage = artifacts.require('AnotherStorage');

// FIXME this doesn't work and no idea how it ever worked because ERC20 is not defined anywhere
// config({
//   contracts: {
//     deploy: {
//       AnotherStorage: {
//         args: ['$ERC20']
//       }
//     }
//   }
// });


contract("AnotherStorageWithInterface", function() {
  this.timeout(0);

  xit("sets an empty address because ERC20 is an interface", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.strictEqual(result.toString(), '0x0000000000000000000000000000000000000000');
  });
});
