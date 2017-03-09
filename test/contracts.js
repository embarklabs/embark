/*globals describe, it*/
var ContractsManager = require('../lib/contracts/contracts.js');
var Logger = require('../lib/core/logger.js');
var assert = require('assert');
var fs = require('fs');

var readFile = function(file) {
  return {filename: file, content: fs.readFileSync(file).toString()};
};

describe('embark.Contratcs', function() {
  describe('simple', function() {
    var contractsManager = new ContractsManager({
      contractFiles:  [
        readFile('test/contracts/simple_storage.sol'),
        readFile('test/contracts/token.sol')
      ],
      contractsConfig: {
        "gas": "auto",
        "contracts": {
          "Token": {
            "args": [
              100
            ]
          },
          "SimpleStorage": {
            "args": [
              200
            ]
          }
        }
      },
      logger: new Logger({})
    });

    describe('#build', function() {
      it('generate contracts', function(done) {
        contractsManager.build(function(err, result) {
          if (err) {
            throw err;
          }

          var contracts = contractsManager.listContracts();
          assert.equal(contracts.length, 2);

          assert.equal(contracts[0].deploy, true);
          assert.deepEqual(contracts[0].args, [100]);
          assert.equal(contracts[0].className, "Token");
          assert.deepEqual(contracts[0].gas, 725000);
          //assert.equal(contracts[0].gasPrice, []); // TODO: test this one
          assert.equal(contracts[0].type, 'file');
          //assert.equal(contracts[0].abiDefinition, '');
          //assert.equal(contracts[0].code, '');
          //assert.equal(contracts[0].runtimeBytecode, '');

          assert.equal(contracts[1].deploy, true);
          assert.deepEqual(contracts[1].args, [200]);
          assert.equal(contracts[1].className, "SimpleStorage");
          assert.deepEqual(contracts[1].gas, 725000);
          //assert.equal(contracts[1].gasPrice, []); // TODO: test this one
          assert.equal(contracts[1].type, 'file');
          //assert.equal(contracts[1].abiDefinition, '');
          //assert.equal(contracts[1].code, '');
          //assert.equal(contracts[1].runtimeBytecode, '');
          done();
        });
      });
    });
  });

  describe('config with contract instances', function() {
    var contractsManager = new ContractsManager({
      contractFiles:  [
        readFile('test/contracts/simple_storage.sol'),
        readFile('test/contracts/token_storage.sol')
      ],
      contractsConfig: {
        "gas": "auto",
        "contracts": {
          "TokenStorage": {
            "args": [
              100,
              "$SimpleStorage"
            ]
          },
          "MySimpleStorage": {
            "instanceOf": "SimpleStorage",
            "args": [
              300
            ]
          },
          "SimpleStorage": {
            "args": [
              200
            ]
          },
          "AnotherSimpleStorage": {
            "instanceOf": "SimpleStorage"
          }
        }
      },
      logger: new Logger({})
    });

    describe('#build', function() {
      it('generate contracts', function(done) {
        contractsManager.build(function(err, result) {
          if (err) {
            throw err;
          }

          var contracts = contractsManager.listContracts();
          assert.equal(contracts.length, 4);

          assert.equal(contracts[0].className, "MySimpleStorage");
          assert.equal(contracts[1].className, "AnotherSimpleStorage");
          assert.equal(contracts[2].className, "SimpleStorage");
          assert.equal(contracts[3].className, "TokenStorage");

          // TokenStorage
          assert.equal(contracts[3].deploy, true);
          assert.deepEqual(contracts[3].args, [100, '$SimpleStorage']);
          assert.deepEqual(contracts[3].gas, 725000);
          assert.equal(contracts[3].type, 'file');
          //assert.equal(contracts[3].abiDefinition, '');
          //assert.equal(contracts[3].code, '');
          //assert.equal(contracts[3].runtimeBytecode, '');

          var parentContract = contracts[2];

          //MySimpleStorage
          assert.equal(contracts[0].deploy, true);
          assert.deepEqual(contracts[0].args, [300]);
          assert.deepEqual(contracts[0].gas, 725000);
          assert.equal(contracts[0].type, 'instance');
          assert.equal(contracts[0].abiDefinition, parentContract.abiDefinition);
          assert.equal(contracts[0].code, parentContract.code);
          assert.equal(contracts[0].runtimeBytecode, parentContract.runtimeBytecode);

          // SimpleStorage
          assert.equal(contracts[2].deploy, true);
          assert.deepEqual(contracts[2].args, [200]);
          assert.deepEqual(contracts[2].gas, 725000);
          assert.equal(contracts[2].type, 'file');
          //assert.equal(contracts[2].abiDefinition, '');
          //assert.equal(contracts[2].code, '');
          //assert.equal(contracts[2].runtimeBytecode, '');

          // AnotherSimpleStorage
          assert.equal(contracts[1].deploy, true);
          assert.deepEqual(contracts[1].args, [200]);
          assert.deepEqual(contracts[1].gas, 725000);
          assert.equal(contracts[1].type, 'instance');
          assert.equal(contracts[1].abiDefinition, parentContract.abiDefinition);
          assert.equal(contracts[1].code, parentContract.code);
          assert.equal(contracts[1].runtimeBytecode, parentContract.runtimeBytecode);
          done();
        });
      });
    });
  });

});
