/*globals describe, it, container, before, after, config, contract*/
let ContractsManager = require('../lib/contracts/contracts.js');
let Logger = require('../lib/core/logger.js');
let File = require('../lib/core/file.js');
let TestLogger = require('../lib/tests/test_logger.js');
let Events = require('../lib/core/events');
let assert = require('assert');

//let SolidityCompiler = require('../lib/modules/solidity');
let Plugins = require('../lib/core/plugins.js');

let readFile = function(file) {
  return new File({filename: file, type: File.types.dapp_file, path: file});
};

describe('embark.Contracts', function() {
  this.timeout(0);
  describe('simple', function() {
    before(function() {
      container.snapshot();
  
      // inject testing bindings
      container.bind('autoLoadAllConfigs').toConstantValue(false);
      container.bind('env').toConstantValue('development');
      container.bind('configDir').toConstantValue('./test/test1/config/');
  
      // if we need to mock any instances, this is where we'd inject them!

      let plugins = container.resolve(Plugins);
      plugins.loadInternalPlugin('solidity', {solcVersion: '0.4.23', contractDirectories: ['app/contracts/']});
      container.unbind(Plugins);
      container.bind(Plugins).toConstantValue(plugins);
  
    });

    after(function(){
      container.restore();
    });
    config({ // contractsConfig
      "versions": {
        "web3.js": "1.0.0-beta",
        "solc": "0.4.23"
      },
      "deployment": {
        "host": "localhost",
        "port": 8545,
        "type": "rpc"
      },
      "dappConnection": [
        "$WEB3",
        "localhost:8545"
      ],
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
    ['test/contracts/simple_storage.sol', 'test/contracts/token.sol'], // contractFiles
    ['app/contracts']); // contractDirectories


    describe('#build', function() {
      it('generate contracts', function(done) {
        let contractsManager = container.get(ContractsManager);
        contractsManager.build(function(err, result) {
          if (err) {
            throw err;
          }

          let contracts = contractsManager.listContracts();
          assert.equal(contracts.length, 2);

          assert.equal(contracts[0].deploy, true);
          assert.deepEqual(contracts[0].args, [100]);
          assert.equal(contracts[0].className, "Token");
          //assert.deepEqual(contracts[0].gas, 725000);
          assert.deepEqual(contracts[0].gas, 'auto');
          //assert.equal(contracts[0].gasPrice, []); // TODO: test this one
          assert.equal(contracts[0].type, 'file');
          //assert.equal(contracts[0].abiDefinition, '');
          //assert.equal(contracts[0].code, '');
          //assert.equal(contracts[0].runtimeBytecode, '');

          assert.equal(contracts[1].deploy, true);
          assert.deepEqual(contracts[1].args, [200]);
          assert.equal(contracts[1].className, "SimpleStorage");
          //assert.deepEqual(contracts[1].gas, 725000);
          assert.deepEqual(contracts[1].gas, 'auto');
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

    describe('#build', function() {
      it('generate contracts', function(done) {
        let contractsManager = container.resolve(ContractsManager);
        contractsManager.build(function(err, result) {
          if (err) {
            throw err;
          }

          let contracts = contractsManager.listContracts();
          assert.equal(contracts.length, 4);

          assert.equal(contracts[0].className, "MySimpleStorage");
          assert.equal(contracts[1].className, "AnotherSimpleStorage");
          assert.equal(contracts[2].className, "SimpleStorage");
          assert.equal(contracts[3].className, "TokenStorage");

          // TokenStorage
          assert.equal(contracts[3].deploy, true);
          assert.deepEqual(contracts[3].args, [100, '$SimpleStorage']);
          //assert.deepEqual(contracts[3].gas, 725000);
          assert.deepEqual(contracts[3].gas, 'auto');
          assert.equal(contracts[3].type, 'file');
          //assert.equal(contracts[3].abiDefinition, '');
          //assert.equal(contracts[3].code, '');
          //assert.equal(contracts[3].runtimeBytecode, '');

          let parentContract = contracts[2];

          //MySimpleStorage
          assert.equal(contracts[0].deploy, true);
          assert.deepEqual(contracts[0].args, [300]);
          //assert.deepEqual(contracts[0].gas, 725000);
          assert.deepEqual(contracts[0].gas, 'auto');
          assert.equal(contracts[0].type, 'instance');
          assert.equal(contracts[0].abiDefinition, parentContract.abiDefinition);
          assert.equal(contracts[0].code, parentContract.code);
          assert.equal(contracts[0].runtimeBytecode, parentContract.runtimeBytecode);

          // SimpleStorage
          assert.equal(contracts[2].deploy, true);
          assert.deepEqual(contracts[2].args, [200]);
          //assert.deepEqual(contracts[2].gas, 725000);
          assert.deepEqual(contracts[2].gas, 'auto');
          assert.equal(contracts[2].type, 'file');
          //assert.equal(contracts[2].abiDefinition, '');
          //assert.equal(contracts[2].code, '');
          //assert.equal(contracts[2].runtimeBytecode, '');

          // AnotherSimpleStorage
          assert.equal(contracts[1].deploy, true);
          assert.deepEqual(contracts[1].args, [200]);
          //assert.deepEqual(contracts[1].gas, 725000);
          assert.deepEqual(contracts[1].gas, 'auto');
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
