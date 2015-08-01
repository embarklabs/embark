var Embark = require('embark-framework');
Embark.init();
Embark.blockchainConfig.loadConfigFile('config/blockchain.yml');
Embark.contractsConfig.loadConfigFile('config/contracts.yml');

var files = ["app/contracts/simple_storage.sol"];

Embark.contractsConfig.init(files, 'development');
var EmbarkSpec = Embark.tests(files);

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
