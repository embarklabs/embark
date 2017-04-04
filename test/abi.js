/*globals describe, it*/
var ABIGenerator = require('../lib/contracts/abi.js');
var assert = require('assert');

// TODO: instead 'eval' the code with a fake web3 object
// and check the generate code interacts as expected
describe('embark.ABIGenerator', function() {

  describe('#generateProvider', function() {
    var generator = new ABIGenerator({blockchainConfig: {rpcHost: 'somehost', rpcPort: '1234'}, contractsManager: {}});

    it('should generate code to connect to a provider', function() {
      var providerCode = "\nvar whenEnvIsLoaded = function(cb) {\n  if (typeof window !== 'undefined' && window !== null) {\n      window.addEventListener('load', cb);\n  } else {\n    cb();\n  }\n}\nwhenEnvIsLoaded(function() {\nif (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {\n\tweb3 = new Web3(web3.currentProvider);\n} else if (typeof Web3 !== 'undefined') {\n\tweb3 = new Web3(new Web3.providers.HttpProvider(\"http://somehost:1234\"));\n}\nweb3.eth.defaultAccount = web3.eth.accounts[0];\n})"

      assert.equal(generator.generateProvider(), providerCode);
    });
  });

  describe('#generateContracts', function() {
    var generator = new ABIGenerator({blockchainConfig: {}, contractsManager: {
      contracts: {
        SimpleStorage: {
          abiDefinition: [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}],
          gasEstimates: 12000,
          deployedAddress: "0x123",
          code: '12345'
        },
        Foo: {
          abiDefinition: [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}],
          gasEstimates: 12000,
          deployedAddress: "0x124",
          code: '123456'
        }
      }
    }});

    describe('with EmbarkJS', function() {
      var withEmbarkJS = true;

      it('should generate contract code', function() {
        var contractCode = "\n\nwhenEnvIsLoaded(function() {\nSimpleStorage = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x123', code: '12345', gasEstimates: 12000});\n});\nwhenEnvIsLoaded(function() {\nFoo = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x124', code: '123456', gasEstimates: 12000});\n});";
        assert.equal(generator.generateContracts(withEmbarkJS), contractCode);
      });
    });

    describe('with default interface', function() {
      var withEmbarkJS = false;

      it('should generate contract code', function() {
        var contractCode = "\n\nwhenEnvIsLoaded(function() {\nSimpleStorageAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nSimpleStorageContract = web3.eth.contract(SimpleStorageAbi);\nSimpleStorage = SimpleStorageContract.at('0x123');\n});\nwhenEnvIsLoaded(function() {\nFooAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nFooContract = web3.eth.contract(FooAbi);\nFoo = FooContract.at('0x124');\n});";
        assert.equal(generator.generateContracts(withEmbarkJS), contractCode);
      });
    });

  });

  //describe('#generateABI', function() {
  //});
});
