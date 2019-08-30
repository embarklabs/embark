const assert = require('assert').strict;
const async = require('async');
const Mocha = require('mocha');
const Web3 = require('web3');

const Reporter = require('./reporter');

const JAVASCRIPT_TEST_MATCH = /^.+\.js$/i;
const TEST_TIMEOUT = 15000; // 15 seconds in milliseconds

class MochaTestRunner {
  constructor(embark, _options) {
    this.embark = embark;

    this.files = [];

    const { events } = embark;
    events.request('tests:runner:register',
      'JavaScript (Mocha)',
      this.match.bind(this),
      this.addFile.bind(this),
      this.run.bind(this)
    );
  }

  addFile(path) {
    if (!this.match(path)) {
      throw new Error(`invalid JavaScript test path: ${path}`);
    }

    this.files.push(path);
  }

  match(path) {
    return JAVASCRIPT_TEST_MATCH.test(path);
  }

  run(options, cb) {
    const {events} = this.embark;

    const Module = require("module");
    const originalRequire = require("module").prototype.require;

    let accounts = [];
    let compiledContracts = {};
    let web3;

    const config = (cfg, acctCb) => {
      global.before((done) => {
        async.waterfall([
          (next) => {
            events.request("contracts:build", cfg, compiledContracts, next);
          },
          (contractsList, contractDeps, next) => {
            events.request("deployment:contracts:deploy", contractsList, contractDeps, next);
          },
          (_result, next) => {
            events.request("contracts:list", next);
          },
          (contracts, next) => {
            for(const contract of contracts) {
              const instance = compiledContracts[contract.className];
              const contractObj = new web3.eth.Contract(instance.abiDefinition, contract.deployedAddress);
              Object.setPrototypeOf(compiledContracts[contract.className], contractObj);
            }

            next();
          }
        ], (err) => {
          if (acctCb) {
            acctCb(err, accounts);
          }

          done();
        });
      });
    };

    async.waterfall([
      (next) => { // request provider
        events.request("blockchain:client:provider", "ethereum", next);
      },
      (bcProvider, next) => { // set provider
        web3 = new Web3(bcProvider);
        next();
      },
      (next) => { // get accounts
        web3.eth.getAccounts((err, accts) => {
          if (err) {
            return next(err);
          }

          accounts = accts;
          next();
        });
      },
      (next) => { // reset contracts as we might have state leakage from other plugins
        events.request("contracts:reset", next);
      },
      (next) => { // get contract files
        events.request("config:contractsFiles", next);
      },
      (cf, next) => { // compile contracts
        events.request("compiler:contracts:compile", cf, next);
      },
      (cc, next) => { // override require
        compiledContracts = cc;

        Module.prototype.require = function(req) {
          const prefix = "Embark/contracts/";
          if (!req.startsWith(prefix)) {
            return originalRequire.apply(this, arguments);
          }

          const contractClass = req.replace(prefix, "");
          const instance = compiledContracts[contractClass];

          if (!instance) {
            throw new Error(`Cannot find module '${req}'`);
          }

          return instance;
        };
        next();
      },
      (next) => { // initialize Mocha
        const mocha = new Mocha();

        mocha.reporter(Reporter, { reporter: options.reporter });
        const describeWithAccounts = (scenario, cb) => {
          Mocha.describe(scenario, cb.bind(mocha, accounts));
        };

        mocha.suite.on('pre-require', () => {
          global.describe = describeWithAccounts;
          global.contract = describeWithAccounts;
          global.assert = assert;
          global.config = config;
        });

        mocha.suite.timeout(TEST_TIMEOUT);
        for(const file of this.files) {
          mocha.addFile(file);
        }

        mocha.run((failures) => {
          next(null, failures);
        });
      }
    ], (err, failures) => {
      Module.prototype.require = originalRequire;
      cb(err, failures);
    });
  }
}

module.exports = MochaTestRunner;
