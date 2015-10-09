var Embark = require('embark-framework');
var ethersim = require('ethersim');
var web3 = require('web3');

var Manager = ethersim.Manager;
var Provider = ethersim.Provider;

var manager = new Manager();
web3.setProvider(new Provider(manager));

Embark.init(web3);
Embark.blockchainConfig.loadConfigFile('config/blockchain.yml');
Embark.contractsConfig.loadConfigFile('config/contracts.yml');

var files = ["app/contracts/simple_storage.sol"];

Embark.contractsConfig.init(files, 'development');

console.log("initializing");

describe("SimpleStorage", function() {
  beforeAll(function(done) {
    Embark.deployContracts('development', files, "/tmp/abi.js", "chains.json", false, function(abi) {
      console.log("return abi");
      console.log(abi);
      eval(abi);
      done();
    });
    //SimpleStorage = EmbarkSpec.request("SimpleStorage", [150]);
  });

  it("should set constructor value", function(done) {
    SimpleStorage.storedData(function(err, result) {
      expect(result.toNumber()).toEqual(100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.set(150, function() {
      SimpleStorage.get(function(err, result) {
        console.log(arguments);
        expect(result.toNumber()).toEqual(150);
        done();
      });
    });
  });

})
