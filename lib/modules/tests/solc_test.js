const Test = require('./test');
const async = require('async');
const fs = require('fs-extra');
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
      self.events.request('config:contractsFiles:add', 'remix_tests.sol', (callback) => {
        callback(self.assertLibCode);
      });
      cb();
    });
  }

  setupTests(files, cb) {
    const self = this;

    async.waterfall([
      function addContracts(next) {
        files.forEach((file) => {
          let testFile = self._prepareContractForTest(file);
          self.events.request('config:contractsFiles:add', file, (callback) => {
            callback(testFile);
          });
        });
        next();
      },
      function initWeb3Provider(next) {
        self.initWeb3Provider(next);
      },
      function resetContracts(next) {
        self.events.request("contracts:reset:dependencies", next);
      },
      function compile(next) {
        console.info('Compiling contracts'.cyan);
        self.events.request("contracts:build", false, next);
      },
      function determineContractsToDeploy(next) {
        self.events.request("contracts:list", (err, contracts) => {
          let contractsToDeploy = contracts.filter((contract) => {
            return contract.filename && contract.filename.indexOf('_test.sol') >= 0;
          });
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
            self.events.request('deploy:contract', contract, cb);
          };
          fns.push(fn);
        });
        async.series(fns, next);
      }
    ], cb);
  }

  runTests(file, cb) {
    const self = this;
    console.info('Running tests'.cyan);
    const forwardSlashFile = file.replace(/\\/g, '/');

    async.waterfall([
      function getContracts(next) {
        self.events.request('contracts:all', (err, contracts) => {
          if (err) {
            return next(err);
          }
          const contractsToTest = [];

          Object.keys(contracts).forEach((contract) => {
            if (contracts[contract].filename &&
              contracts[contract].filename.replace(/\\/g, '/') === forwardSlashFile) {
              contractsToTest.push(contracts[contract]);
            }
          });
          next(null, contractsToTest);
        });
      },
      function getWeb3Object(contracts, next) {
        self.events.request('blockchain:get', (web3) => {
          next(null, contracts, web3);
        });
      },
      function run(contracts, web3, next) {
        let fns = [];
        contracts.forEach((contract) => {
          let fn = (_callback) => {
            // TODO: web3 is not injected into the function. Issue has been raised on remixTests.
            // To fix once web3 has been made injectable.
            remixTests.runTest(contract.className, Test.getWeb3Contract(contract, web3),
              self._prettyPrint.bind(self), _callback);
          };
          fns.push(fn);
        });
        async.series(fns, next);
      }
    ], cb);
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
      console.info(color('suite', '%s'), obj.value);
    } else if(obj.type === 'testPass') {
      let fmt = color('checkmark', '  ' + Base.symbols.ok) + color('pass', ' %s');
      console.info(fmt, obj.value);
    } else if(obj.type === 'testFailure') {
      let fmt = color('fail', '  %s %s');
      console.info(fmt, Base.symbols.err, obj.value);
    }
  }
}

module.exports = SolcTest;
