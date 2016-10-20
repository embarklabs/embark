var Config = require('../lib/config/config.js');
var Test = require('../lib/test.js');
var Compiler = require('../lib/compiler.js');
var assert = require('assert');

//var contractFiles = grunt.file.expand("./app/contracts/**/*.sol")

describe('embark.test', function() {
  //var files = [
  //  'test/support/contracts/simple_storage.sol'
  //]
  //var _blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml');
  //var blockchainConfig = _blockchainConfig.config("development");
  //var compiler = new Compiler(_blockchainConfig);
  //var contractsConfig = new Config.Contracts(blockchainConfig, compiler);
  //contractsConfig.loadConfigFile('test/support/contracts.yml');
  //contractsConfig.init(files, 'development');

  //describe('simple test', function() {
  //  var embarkSpec = new Test(contractsConfig, files);

  //  it('execute simple test', function() {
  //    var SimpleStorage = embarkSpec.request('SimpleStorage', [100])

  //    assert.equal(SimpleStorage.storedData(), '100');
  //  });
  //});

});
