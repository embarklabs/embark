/*globals describe, it*/
let CodeGenerator = require('../lib/contracts/code_generator.js');
let assert = require('assert');

function replaceCRLF(string) {
  return string.replace(/\r\n/g, '\n');
}

// TODO: instead 'eval' the code with a fake web3 object
// and check the generate code interacts as expected
describe('embark.CodeGenerator', function() {
  this.timeout(0);
  describe('#generateProvider', function() {
    let generator = new CodeGenerator({contractsConfig: {"dappConnection": [ "$WEB3", "http://somehost:1234" ] }, contractsManager: {}});

    it('should generate code to connect to a provider', function() {
      var providerCode = 'function __reduce(arr, memo, iteratee, cb) {\n  if (typeof cb !== \'function\') {\n    if (typeof memo === \'function\' && typeof iteratee === \'function\') {\n      cb = iteratee;\n      iteratee = memo;\n      memo = [];\n    } else {\n      throw new TypeError(\'expected callback to be a function\');\n    }\n  }\n\n  if (!Array.isArray(arr)) {\n    cb(new TypeError(\'expected an array\'));\n    return;\n  }\n\n  if (typeof iteratee !== \'function\') {\n    cb(new TypeError(\'expected iteratee to be a function\'));\n    return;\n  }\n\n  (function next(i, acc) {\n    if (i === arr.length) {\n      cb(null, acc);\n      return;\n    }\n\n    iteratee(acc, arr[i], function(err, val) {\n      if (err) {\n        cb(err);\n        return;\n      }\n      next(i + 1, val);\n    });\n  })(0, memo);\n};\nvar __mainContext = __mainContext || this;\n__mainContext.__LoadManager = function() { this.list = []; this.done = false; }\n__mainContext.__LoadManager.prototype.execWhenReady = function(cb) { if (this.done) { cb(); } else { this.list.push(cb) } }\n__mainContext.__LoadManager.prototype.doFirst = function(todo) { var self = this; todo(function() { self.done = true; self.list.map((x) => x.apply()) }) }\n__mainContext.__loadManagerInstance = new __mainContext.__LoadManager();\nvar whenEnvIsLoaded = function(cb) {\n  if (typeof document !== \'undefined\' && document !== null && !/comp|inter|loaded/.test(document.readyState)) {\n      document.addEventListener(\'DOMContentLoaded\', cb);\n  } else {\n    cb();\n  }\n}\nwhenEnvIsLoaded(function(){\n  __mainContext.__loadManagerInstance.doFirst(function(done) {\n    __mainContext.web3 = undefined;\n__reduce(["$WEB3","http://somehost:1234"],function(prev, value, next) {\n  if (prev === false) {\n    return next(null, false);\n  }\n\n  if (value === \'$WEB3\' && (typeof web3 !== \'undefined\' && typeof Web3 !== \'undefined\')) {\n    web3.setProvider(web3.givenProvider);\n  } else if (value !== \'$WEB3\' && (typeof Web3 !== \'undefined\' && ((typeof web3 === \'undefined\') || (typeof web3 !== \'undefined\' && (!web3.isConnected || (web3.isConnected && !web3.isConnected())))))) {\n    if (value.indexOf(\'ws://\') >= 0) {\n      web3.setProvider(new Web3.providers.WebsocketProvider(value));\n    } else {\n      web3.setProvider(new Web3.providers.HttpProvider(value));\n    }\n  } else if (value === \'$WEB3\') {\n    return next(null, \'\');\n  }\n\n  web3.eth.getAccounts(function(err, account) {\n    if (err) {\n      next(null, true)\n    } else {\n      next(null, false)\n    }\n  });\n}, function(err, _result) {\n  web3.eth.getAccounts(function(err, accounts) {\n    web3.eth.defaultAccount = accounts[0];\n    done();\n  });\n});\n\n  })\n});\n\n';

      assert.strictEqual(replaceCRLF(generator.generateProvider()), providerCode);
    });
  });

  describe('#generateContracts', function() {
    let generator = new CodeGenerator({blockchainConfig: {}, contractsManager: {
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
      let withEmbarkJS = true;

      it('should generate contract code', function() {
        var contractCode = "\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  __mainContext.SimpleStorage = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x123', code: '12345', gasEstimates: 12000});\n\n});\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  __mainContext.Foo = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x124', code: '123456', gasEstimates: 12000});\n\n});\n";
        assert.strictEqual(replaceCRLF(generator.generateContracts(withEmbarkJS)), contractCode);
      });
    });

    describe('with default interface', function() {
      let withEmbarkJS = false;

      it('should generate contract code', function() {
        var contractCode = "\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  SimpleStorageAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nSimpleStorage = new web3.eth.Contract(SimpleStorageAbi);\nSimpleStorage.options.address = '0x123';\nSimpleStorage.address = '0x123';\nSimpleStorage.options.from = web3.eth.defaultAccount;\n\n\n});\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  FooAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nFoo = new web3.eth.Contract(FooAbi);\nFoo.options.address = '0x124';\nFoo.address = '0x124';\nFoo.options.from = web3.eth.defaultAccount;\n\n\n});\n";
        assert.strictEqual(replaceCRLF(generator.generateContracts(withEmbarkJS)), contractCode);
      });
    });

  });

  //describe('#generateABI', function() {
  //});
});
