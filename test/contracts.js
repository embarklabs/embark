/*globals describe, it*/
let ContractsManager = require('../lib/contracts/contracts.js');
let Compiler = require('../lib/modules/compiler/');
let Logger = require('../lib/core/logger.js');
let File = require('../lib/core/file.js');
let TestLogger = require('../lib/tests/test_logger.js');
let Events = require('../lib/core/events');
let Ipc = require('../lib/core/ipc.js');
let assert = require('assert');

//let SolidityCompiler = require('../lib/modules/solidity');
let Plugins = require('../lib/core/plugins.js');

let readFile = function(file) {
  return new File({filename: file, type: File.types.dapp_file, path: file});
};

const currentSolcVersion = require('../package.json').dependencies.solc;
const TestEvents = {
  request: (cmd, cb) => {
    cb(currentSolcVersion);
  }
};

describe('embark.Contracts', function() {
  this.timeout(0);
  describe('simple', function() {
    let plugins = new Plugins({
      logger: new TestLogger({}),
      events: TestEvents,
      config: {
        contractDirectories: ['app/contracts/']
      }
    });
    let ipcObject = new Ipc({
      ipcRole: 'none'
    });
    plugins.loadInternalPlugin('solidity', {ipc: ipcObject});

    let events = new Events();
    let compiler = new Compiler({events: events, logger: plugins.logger}, {plugins: plugins});

    events.setCommandHandler("config:contractsConfig", function(cb) {
      cb(contractsConfig);
    });

    events.setCommandHandler("config:contractsFiles", (cb) => {
      cb([]);
    });

    events.setCommandHandler("blockchain:gasPrice", (cb) => {
      cb(null, 100);
    });

    let contractsConfig = {
      "versions": {
        "web3.js": "1.0.0-beta",
        "solc": "0.4.24"
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
    };

    let contractsManager = new ContractsManager({
      plugins: plugins,
      contractFiles:  [
        readFile('test/contracts/simple_storage.sol'),
        readFile('test/contracts/token.sol')
      ],
      contractDirectories: ['app/contracts'],
      contractsConfig: contractsConfig,
      logger: new Logger({}),
      events: events
    });

    describe('#build', function() {
      it('generate contracts', function(done) {
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
    let plugins = new Plugins({
      logger: new TestLogger({}),
      events: TestEvents,
      config: {
        contractDirectories: ['app/contracts/']
      }
    });
    let ipcObject = new Ipc({
      ipcRole: 'none'
    });
    plugins.loadInternalPlugin('solidity', {ipc: ipcObject});

    let events = new Events();
    let compiler = new Compiler({events: events, logger: plugins.logger}, {plugins: plugins});

    events.setCommandHandler("config:contractsConfig", function(cb) {
      cb(contractsConfig);
    });

    events.setCommandHandler("config:contractsFiles", (cb) => {
      cb([]);
    });

    events.setCommandHandler("blockchain:gasPrice", (cb) => {
      cb(null, 100);
    });

    let contractsConfig = {
      "versions": {
        "web3.js": "1.0.0-beta",
        "solc": "0.4.24"
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
    }

    let contractsManager = new ContractsManager({
      plugins: plugins,
      contractFiles:  [
        readFile('test/contracts/simple_storage.sol'),
        readFile('test/contracts/token_storage.sol')
      ],
      contractDirectories: ['app/contracts'],
      contractsConfig: contractsConfig,
      logger: new Logger({}),
      events: events
    });

    describe('#build', function() {
      it('generate contracts', function(done) {
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
