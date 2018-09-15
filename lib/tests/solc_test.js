const Test = require('./test');
const async = require('async');
const fs = require('fs-extra');
const File = require('./../core/file');
const remixTests = require('remix-tests');
const Base = require('mocha/lib/reporters/base');
const color = Base.color;

class SolcTest extends Test {
  constructor(options) {
    super(options);
    this.assertLibCode = remixTests.assertLibCode;
  }
  init(cb) {
    const self = this;
    super.init(() => {
      let assertFile = new File({
        filename: 'Custom_Assert.sol',
        type: File.types.custom,
        path: 'Custom_Assert.sol',
        resolver: (callback) => {
          callback(self.assertLibCode);
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
        console.info('Deploying contracts'.cyan);
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
          remixTests.runTest(contractToTest.className, contractObject, self._prettyPrint.bind(self), next);
        });
      }
    ], cb);
  }

  // dynamically insert Assert.sol library as an import
  // regexIndexOf has been added to String prototype in remix-tests module
  _prepareContractForTest(file) {
    let c = fs.readFileSync(file).toString();
    const s = /^(import)\s['"](Custom_Assert.sol)['"];/gm;
    if (c.regexIndexOf(s) < 0) {
      c = c.replace(/(pragma solidity \^\d+\.\d+\.\d+;)/, '$1\nimport \'Custom_Assert.sol\';');
    }
    return c;
  }

  _prettyPrint(obj) {
    if (obj.type === 'contract') {
      console.log(color('suite', '%s'), obj.value);
    } else if(obj.type === 'testPass') {
      let fmt = color('checkmark', '  ' + Base.symbols.ok) + color('pass', ' %s');
      console.log(fmt, obj.value);
    } else if(obj.type === 'testFailure') {
      let fmt = color('fail', '  %s %s');
      console.log(fmt, Base.symbols.err, obj.value);
    }
  }
}

module.exports = SolcTest;
