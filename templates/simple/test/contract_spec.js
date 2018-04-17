//describe("SimpleStorage", function() {
//  this.timeout(0);
//  before(function(done) {
//    this.timeout(0);
//    var contractsConfig = {
//      "SimpleStorage": {
//        args: [100]
//      }
//    };
//    EmbarkSpec.deployAll(contractsConfig, () => { done() });
//  });
//
//  it("should set constructor value", async function() {
//    let result = await SimpleStorage.methods.storedData().call();
//    assert.equal(result, 100);
//  });
//
//  it("set storage value", async function() {
//    await SimpleStorage.methods.set(150).send();
//    let result = await SimpleStorage.methods.get().call();
//    assert.equal(result, 150);
//  });
//
//});
