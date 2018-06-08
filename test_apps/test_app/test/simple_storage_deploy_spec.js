/*global contract, config, it, embark, assert, web3*/
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');
let accounts;

config((err, theAccounts) => {
  accounts = theAccounts;
});

contract("SimpleStorage Deploy", function () {
  let SimpleStorageInstance;

  before(async function() {
    SimpleStorageInstance = await SimpleStorage.deploy({arguments: [150]}).send();
  });

  it("should set constructor value", async function () {
    let result = await SimpleStorageInstance.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });

  it("set storage value", async function () {
    await SimpleStorageInstance.methods.set(150).send();
    let result = await SimpleStorageInstance.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 499650);
  });

});
