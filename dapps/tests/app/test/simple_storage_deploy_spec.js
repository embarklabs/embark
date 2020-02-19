/*global artifacts, contract, it, assert, before, web3*/
const SimpleStorage = artifacts.require('SimpleStorage');
const {Utils} = artifacts.require('EmbarkJS');

contract("SimpleStorage Deploy", function () {
  let simpleStorageInstance;
  before(async () => {
    return new Promise(async (resolve, reject) => {
      const gas = await SimpleStorage.deploy({arguments: [150]}).estimateGas();

      Utils.secureSend(web3, SimpleStorage.deploy({arguments: [150]}), {gas, from: web3.eth.defaultAccount}, true, function(err, receipt) {
        if(err) {
          return reject(err);
        }
        simpleStorageInstance = SimpleStorage;
        simpleStorageInstance.options.address = receipt.contractAddress;
        resolve();
      });
    });
  });

  it("should set constructor value", async function () {
    let result = await simpleStorageInstance.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });

  it("set storage value", function() {
    return new Promise(async (resolve, reject) => {
      const gas = await simpleStorageInstance.methods.set(200).estimateGas();
      Utils.secureSend(web3, simpleStorageInstance.methods.set(200), {gas}, false, async function(err) {
        if (err) {
          return reject(err);
        }
        let result = await simpleStorageInstance.methods.get().call();
        assert.strictEqual(parseInt(result, 10), 200);
        resolve();
      });
    });
  });
});
