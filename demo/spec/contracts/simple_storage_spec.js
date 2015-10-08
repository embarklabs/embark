var Embark = require('embark-framework');
var ethersim = require('ethersim');
var web3 = require('web3');
Embark.init();
Embark.blockchainConfig.loadConfigFile('config/blockchain.yml');
Embark.contractsConfig.loadConfigFile('config/contracts.yml');

var files = ["app/contracts/simple_storage.sol"];

Embark.contractsConfig.init(files, 'development');

var Manager = ethersim.Manager;
var Provider = ethersim.Provider;

console.log("initializing");
var manager = new Manager();

web3.setProvider(new Provider(manager));
abi = Embark.deployContracts('development', files, "/tmp/abi.js", "chains.json", web3);
console.log(abi);
eval(abi);

describe("SimpleStorage", function() {
  beforeAll(function() {
    SimpleStorage = EmbarkSpec.request("SimpleStorage", [150]);
  });

  it("should set constructor value", function() {
    expect(SimpleStorage.storedData()).toEqual('150');
  });

  it("set storage value", function() {
    SimpleStorage.set(100);
    expect(SimpleStorage.get()).toEqual('100');
  });

})
