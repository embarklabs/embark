/*global contract, it, embark, assert, before*/
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');

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
