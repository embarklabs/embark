var Compiler = require('../lib/compiler.js');
var assert = require('assert');

describe('embark.compiler', function() {

  describe('compile a file', function() {
    var files = [
      'test/support/contracts/simple_storage.sol'
    ];

    it("should build a correct compiled object", function() {
      var compiler = new Compiler();

      var compiledFile = compiler.compile(files[0]);

      assert.equal(compiledFile.SimpleStorage.code, '606060405260405160208060f78339016040526060805190602001505b806000600050819055505b5060c28060356000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480632a1afcd914604b57806360fe47b114606a5780636d4ce63c14607b576049565b005b605460045060b9565b6040518082815260200191505060405180910390f35b6079600480359060200150609a565b005b608460045060a8565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b6000600060005054905060b6565b90565b6000600050548156');

      assert.equal(JSON.stringify(compiledFile.SimpleStorage.info.abiDefinition), '[{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}]');
      });

  });

  describe('compile a file with an error', function() {
    var files = [
      'test/support/contracts/error.sol'
    ];

    it("throw an error", function() {
      var compiler = new Compiler();

      assert.throws(function() { compiler.compile(files[0]) }, Error);
    });

  });

});

