const Test = require('./test');
const async = require('async');
const fs = require('fs-extra');
const File = require('./../../core/file');
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
        filename: 'remix_tests.sol',
        type: File.types.custom,
        path: 'remix_tests.sol',
        resolver: (callback) => {
          callback(self.assertLibCode);
        }});
      self.engine.config.contractsFiles.push(assertFile);
      cb();
    });
  }
  setupTests(files, cb) {
    const self = this;
    files.forEach((file) => {
      let testFile = self._prepareContractForTest(file);
      self.engine.config.contractsFiles.push(new File({filename: file, type: File.types.custom, path: file, resolver: function (callback) {
        callback(testFile);
      }}));
    });

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
      function determineContractsToDeploy(next) {
        self.engine.events.request("contracts:list", (err, contracts) => {
          let contractsToDeploy = contracts.filter((contract) => contract.filename.indexOf('_test.sol') >=0);
          let assertLib = contracts.filter((contract) => contract.filename === 'remix_tests.sol')[0];
          next(null, [assertLib].concat(contractsToDeploy));
        });
      },
      function deployContracts(contracts, next) {
        console.info('Deploying contracts'.cyan);
        let fns = [];
        contracts.forEach((contract) => {
          contract._gasLimit = self.gasLimit;
          let fn = (cb) => {
            self.engine.events.request('deploy:contract', contract, cb);
          };
          fns.push(fn);
        });
        async.series(fns, next);
      }
    ],cb);
  }
  runTests(file, cb) {
    console.info('Running tests'.cyan);
    const self = this;
    self.engine.events.request('contracts:all', (err, contracts) => {
      let contractsToTest = [];
      Object.keys(contracts).forEach((contract) => {
        if(contracts[contract].filename === file) {
          contractsToTest.push(contracts[contract]);
        }
      });
      let fns = [];
      contractsToTest.forEach((contract) => {
        let contractObject = self._convertToWeb3(contract);
        let fn = (_callback) => {
          // TODO: web3 is not injected into the function. Issue has been raised on remixTests.
          // To fix once web3 has been made injectable.
          remixTests.runTest(contract.className, contractObject, self._prettyPrint.bind(self), _callback);
        };
        fns.push(fn);
      });
      async.series(fns, cb);
    });
  }
  _convertToWeb3(contract) {
    let contractObject = new this.web3.eth.Contract(contract.abiDefinition);
    contractObject.options.address = contract.deployedAddress;
    contractObject.options.from = contract.deploymentAccount;
    contractObject.options.gas = contract.gas;
    contractObject.filename = contract.filename;
    return contractObject;
  }
  // dynamically insert Assert library as an import
  // regexIndexOf has been added to String's prototype in remix-tests module
  _prepareContractForTest(file) {
    let c = fs.readFileSync(file).toString();
    const s = /^(import)\s['"](remix_tests.sol)['"];/gm;
    if (c.regexIndexOf(s) < 0) {
      c = c.replace(/(pragma solidity \^\d+\.\d+\.\d+;)/, '$1\nimport \"remix_tests.sol\";');
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
