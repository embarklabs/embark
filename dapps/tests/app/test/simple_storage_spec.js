/*global contract, config, it, assert, web3*/
const SimpleStorage = artifacts.require('SimpleStorage');
let accounts;
const {Utils} = artifacts.require('EmbarkJS');

config({
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100],
        onDeploy: (dependencies) => {
          return dependencies.contracts.SimpleStorage.methods.setRegistar(dependencies.contracts.SimpleStorage.options.address).send();
        }
      }
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
});

contract("SimpleStorage", function() {
  this.timeout(0);

  it("should set constructor value", async function() {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", function(done) {
    Utils.secureSend(web3, SimpleStorage.methods.set(150), {}, false, async function(err) {
      if (err) {
        return done(err);
      }
      let result = await SimpleStorage.methods.get().call();
      assert.strictEqual(parseInt(result, 10), 150);
      done();
    });
  });

  it("should set to self address", async function() {
    let result = await SimpleStorage.methods.registar().call();
    assert.strictEqual(result, SimpleStorage.options.address);
  });

  it('should have the right defaultAccount', function() {
    assert.strictEqual(accounts[0], web3.eth.defaultAccount);
  });

  it("should alias contract address", function() {
    assert.strictEqual(SimpleStorage.options.address, SimpleStorage.address);
  });

  it('listens to events', async function() {
    const promise = new Promise((resolve) => {
      SimpleStorage.once("EventOnSet2", (error, result) => {
        assert.strictEqual(error, null);
        assert.strictEqual(parseInt(result.returnValues.setValue, 10), 150);
        resolve();
      });
    });

    await SimpleStorage.methods.set2(150).send();

    // execute the same method/value twice as a workaround for getting this test 
    // to pass with --node=embark. The cause of the issue and how the workaround
    // works is still unknown.
    await SimpleStorage.methods.set2(150).send();
    
    return promise;
  });

  it('asserts event triggered', async function() {
    const tx = await SimpleStorage.methods.set2(160).send();
    assert.eventEmitted(tx, 'EventOnSet2', {passed: true, message: "hi", setValue: "160"});
  });

  it("should revert with a value lower than 5", async function() {
    await assert.reverts(SimpleStorage.methods.set3(2), {from: web3.eth.defaultAccount}, 'Returned error: VM Exception while processing transaction: revert Value needs to be higher than 5');
  });
});
