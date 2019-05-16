/*global contract, config, it, assert*/
const SimpleStorage = require('Embark/contracts/SimpleStorage');
const EmbarkJS = require('Embark/EmbarkJS');

let accounts;

// For documentation please see https://embark.status.im/docs/contracts_testing.html
config({
  // deployment: {
  //   host: "localhost",
  //   port: 8545,
  //   type: "rpc"
  // },
  contracts: {
    "SimpleStorage": {
      args: [100]
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts
});

contract("SimpleStorage", function () {
  this.timeout(0);
  before(done => {
    setTimeout(done, 2000);
  });

  it('should have access to ENS functions', function(done) {
    EmbarkJS.Names.resolve('eth', (err, addr) => {
      if (err) {
        return done(err);
      }
      try{
        assert.strictEqual(addr, web3.eth.defaultAccount);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should have access to Storage functions', async function() {
    const hash = await EmbarkJS.Storage.saveText('myText');
    const text = await EmbarkJS.Storage.get(hash);
    assert.strictEqual(text, 'myText');
  });

  it("should set constructor value", async function () {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", async function () {
    await SimpleStorage.methods.set(150).send();
    let result = await SimpleStorage.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 150);
  });

  it("should have account with balance", async function() {
    let balance = await web3.eth.getBalance(accounts[0]);
    assert.ok(parseInt(balance, 10) > 0);
  });
});
