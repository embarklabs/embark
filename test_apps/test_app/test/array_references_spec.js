contract("SomeContract", function() {
  this.timeout(0);
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "SimpleStorage": {
        args: [100]
      },
      "Token": {
        deploy: false,
        args: [1000]
      },
      "MyToken2": {
        instanceOf: "Token",
        args: [2000]
      },
      "SomeContract": {
        "args": [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("set MyToken2 address", async function() {
    let address = await SomeContract.methods.addr_1().call();
    assert.equal(address, MyToken2.options.address);
  });

  it("set SimpleStorage address", async function() {
    let address = await SomeContract.methods.addr_2().call();
    assert.equal(address, SimpleStorage.options.address);
  });

});

