/*global contract, config, it, assert, web3*/
const SimpleStorage = require('Embark/contracts/SimpleStorage');
let accounts;

config({
  deployment: {
    type: 'ws',
    host: 'localhost',
    port: '8546'
  },
  contracts: {
    "SimpleStorage": {
      args: [100],
      onDeploy: ["SimpleStorage.methods.setRegistar(web3.eth.defaultAccount).send()"]
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
});

contract("SimpleStorage", function () {
  this.timeout(0);

  it("should set constructor value", async function () {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", async function () {
    await SimpleStorage.methods.set(150).send();
    let result = await SimpleStorage.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 499650);
  });

  it("should set defaultAccount", async function () {
    let result = await SimpleStorage.methods.registar().call();
    assert.strictEqual(result, web3.eth.defaultAccount);
    assert.strictEqual(accounts[0], web3.eth.defaultAccount);
  });

  it("should alias contract address", function () {
    assert.strictEqual(SimpleStorage.options.address, SimpleStorage.address);
  });

  it('listens to events', function (done) {
    SimpleStorage.once('EventOnSet2', function(error, _result){
      console.log('error', error);
      console.log('result', _result);

      /*assert.strictEqual(error, null);
      let result = await SimpleStorage.methods.get().call();
      assert.strictEqual(parseInt(result, 10), 150);*/
      done(error);
    });

    console.log('TEST');
    SimpleStorage.methods.set2(150, 100).send(() => {
      console.log('Done');
    });
  });

});
