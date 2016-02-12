var Compiler = require('../lib/compiler.js');
var assert = require('assert');

describe('embark.compiler', function() {

  describe('compile a file', function() {
    var files = [
      'test/support/contracts/simple_storage.sol'
    ];

    it("should build a correct compiled object", function() {
      var compiler = new Compiler();

      var compiledFile = compiler.compile(files);

      assert.equal(compiledFile.SimpleStorage.code, '60606040526040516020806075833950608060405251600081905550604e8060276000396000f3606060405260e060020a60003504632a1afcd98114602e57806360fe47b11460365780636d4ce63c146040575b005b604460005481565b600435600055602c565b6000545b6060908152602090f3');

      assert.equal(JSON.stringify(compiledFile.SimpleStorage.info.abiDefinition), '[{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}]');
      });

  });

  describe('compile a file with an error', function() {
    var files = [
      'test/support/contracts/error.sol'
    ];

    it("throw an error", function() {
      var compiler = new Compiler();

      assert.throws(function() { compiler.compile(files) }, Error);
    });

  });

  describe('compile a serpent file', function() {
    var files = [
      'test/support/contracts/cash.se'
    ];

    it("should build a correct compiled object", function() {
      var compiler = new Compiler();

      var compiledFile = compiler.compile(files);

      assert.equal(compiledFile.cash.code, '6000603f536a0186a000000000000000006040604059905901600090526000815232816020015280905020556103658061003a60003961039f56600061047f537c010000000000000000000000000000000000000000000000000000000060003504638357984f81141561005f57600435604052604060405990590160009052600081526040518160200152809050205460605260206060f35b63693200ce8114156101465760043560a05260243560c0523260e0526040604059905901600090526000815260e051816020015280905020546101005260c051610100511215156101385760c0516040604059905901600090526000815260e05181602001528090502054036040604059905901600090526000815260e0518160200152809050205560c0516040604059905901600090526000815260a05181602001528090502054016040604059905901600090526000815260a0518160200152809050205560c0516101c05260206101c0f3610145565b60006101e05260206101e0f35b5b6380b97fc081141561024c5760043560a05260243560c05260443561020052326102005114151561017e576000610220526020610220f35b6040604059905901600090526000815261020051816020015280905020546101005260c0516101005112151561023e5760c0516040604059905901600090526000815261020051816020015280905020540360406040599059016000905260008152610200518160200152809050205560c0516040604059905901600090526000815260a05181602001528090502054016040604059905901600090526000815260a0518160200152809050205560c0516102e05260206102e0f361024b565b6000610300526020610300f35b5b634c764abc8114156102b4576004356103205260243561034052610340516040604059905901600090526000815261032051816020015280905020540360406040599059016000905260008152610320518160200152809050205560016103a05260206103a0f35b63a92c9b8381141561031c57600435610320526024356103405261034051604060405990590160009052600081526103205181602001528090502054016040604059905901600090526000815261032051816020015280905020556001610400526020610400f35b631d62e92281141561036357600435604052602435610420526104205160406040599059016000905260008152604051816020015280905020556001610460526020610460f35b505b6000f3');

      assert.equal(JSON.stringify(compiledFile.cash.info.abiDefinition), '[{\"name\":\"addCash(int256,int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"ID\",\"type\":\"int256\"},{\"name\":\"amount\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true},{\"name\":\"balance(int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"address\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true},{\"name\":\"send(int256,int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"recver\",\"type\":\"int256\"},{\"name\":\"value\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true},{\"name\":\"sendFrom(int256,int256,int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"recver\",\"type\":\"int256\"},{\"name\":\"value\",\"type\":\"int256\"},{\"name\":\"from\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true},{\"name\":\"setCash(int256,int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"address\",\"type\":\"int256\"},{\"name\":\"balance\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true},{\"name\":\"subtractCash(int256,int256)\",\"type\":\"function\",\"inputs\":[{\"name\":\"ID\",\"type\":\"int256\"},{\"name\":\"amount\",\"type\":\"int256\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"int256\"}],\"constant\":true}]');

      });

  });

  describe('compile a file with an error', function() {
    var files = [
      'test/support/contracts/error.sol'
    ];

    it("throw an error", function() {
      var compiler = new Compiler();

      assert.throws(function() { compiler.compile(files) }, Error);
    });

  });


});

