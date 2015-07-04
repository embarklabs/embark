var Config = require('../lib/config/config.js');
var Test = require('../lib/test.js');
var assert = require('assert');
var web3 = require('web3');

//var contractFiles = grunt.file.expand("./app/contracts/**/*.sol")

describe('embark.test', function() {
  var files = [
    'test/support/contracts/simple_storage.sol'
  ]
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config("development");
  var contractsConfig = new Config.Contracts(blockchainConfig, web3);
  contractsConfig.loadConfigFile('test/support/contracts.yml');
  contractsConfig.init(files);

  describe('simple test', function() {
    var embarkSpec = new Test(contractsConfig, files);

    it('execute simple test', function() {
      var SimpleStorage = embarkSpec.request('SimpleStorage', [100])

      assert.equal(SimpleStorage.storedData(), '100');
    });
  });

});
