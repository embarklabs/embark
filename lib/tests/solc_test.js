const Test = require('./test');
const async = require('async');
const fs = require('fs-extra');
const path = require('path');
const File = require('./../core/file');
const remixTests = require('remix-tests');

class SolcTest extends Test {
  constructor(options) {
    super(options);
    this.assertLib = options.assertLib || path.resolve(__dirname, './Assert.sol');
  }
  init(cb) {
    const self = this;
    super.init(() => {
      let assertFile = new File({filename: 'Assert.sol', type: File.types.custom, path: 'Assert.sol', resolver: (callback) => {
        callback(fs.readFileSync(self.assertLib).toString());
      }});
      self.engine.config.contractsFiles.push(assertFile);
      cb();
    });
  }

  runTests(file, cb) {
    const self = this;
    let testFile = this._prepareContractForTest(file);
    this.engine.config.contractsFiles.push(new File({filename: file, type: File.types.custom, path: file, resolver: function (callback) {
      callback(testFile);
    }}));

    async.waterfall([
      function initWeb3Provider(next) {
        self.initWeb3Provider(next);
      },
      function resetContracts(next) {
        self.engine.events.request("contracts:reset:dependencies", next);
      },
      function compile(next) {
        console.info('Compiling contracts'.cyan);
        self.engine.events.request("contracts:build", false, next);
      },
      function deploy(next) {
        self.engine.config.contractsConfig = {contracts : {}};
        self.engine.events.request('deploy:contracts', next);
      },
      function runTests(next) {
        self.engine.events.request('contracts:all', (err, contracts) => {
          let contractToTest;
          Object.keys(contracts).forEach((contract) => {
            if(contracts[contract].filename === file) {
              contractToTest = contracts[contract];
            }
          });
          let contractObject = new self.web3.eth.Contract(contractToTest.abiDefinition);
          contractObject.options.address = contractToTest.deployedAddress;
          contractObject.options.from = contractToTest.deploymentAccount;
          contractObject.options.gas = contractToTest.gas;
          contractObject.filename = contractToTest.filename;
          remixTests.runTest(contractToTest.className, contractObject, console.log, next);
        });
      }
    ], cb);
  }

  _prepareContractForTest(file) {
    let c = fs.readFileSync(file).toString();
    const s = /^(import)\s['"](remix_tests.sol|tests.sol)['"];/gm;
    if (c.regexIndexOf(s) < 0) {
      c = c.replace(/(pragma solidity \^\d+\.\d+\.\d+;)/, '$1\nimport \'Assert.sol\';');
    }
    return c;
  }
}

module.exports = SolcTest;
