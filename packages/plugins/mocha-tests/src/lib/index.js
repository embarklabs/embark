import 'colors';
import {__} from 'embark-i18n';

const async = require('async');
const EmbarkJS = require('embarkjs');
const Mocha = require('mocha');
const Web3 = require('web3');

const Reporter = require('./reporter');

const GAS_LIMIT = 8000000;
const JAVASCRIPT_TEST_MATCH = /^.+\.js$/i;
const TEST_TIMEOUT = 15000; // 15 seconds in milliseconds

class MochaTestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.logger = embark.logger;
    this.fs = embark.fs;

    this.files = [];
    this.options = {};
    this.web3 = null;

    this.events.request('tests:runner:register',
      'JavaScript (Mocha)',
      this.match.bind(this),
      this.addFile.bind(this),
      this.run.bind(this)
    );
  }

  static originalRequire = require('module').prototype.require;

  static requireArtifact(artifactName, compiledContracts) {
    if (artifactName === 'EmbarkJS') return EmbarkJS;

    const instance = compiledContracts[artifactName];

    if (!instance) {
      compiledContracts[artifactName] = {};
    }

    if (!compiledContracts[artifactName].abiDefinition) {
      return compiledContracts[artifactName];
    }

    try {
      return Object.setPrototypeOf(
        instance,
        EmbarkJS.Blockchain.Contract(instance)
      );
    } catch (e) {
      return instance;
    }
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

  async run(options, cb) {
    const {events} = this.embark;
    const {reporter} = options;
    this.options = options;

    const Module = require("module");

    let accounts = [];
    let compiledContracts = {};

    const config = (cfg, acctCb) => {
      global.before((done) => {
        async.waterfall([
          (next) => {
            events.request("tests:deployment:check", cfg, this.options, (err, provider) => {
              if (err) {
                return next(err);
              }
              if (provider) {
                this.web3.setProvider(provider);
              }
              next();
            });
          },
          (next) => {
            events.request('tests:config:check', cfg, (err) => {
              if (err) {
                return next(err);
              }
              next();
            });
          },

          (next) => {
            this.web3.eth.getAccounts((err, accts) => {
              if (err) {
                return next(err);
              }
              accounts = accts;
              this.web3.eth.defaultAccount = accts[0];
              global.web3.eth.defaultAccount = accts[0];
              next();
            });
          },
          (next) => {
          // Remove contracts that are not in the configs
            const realContracts = {};
            const deployKeys = Object.keys(cfg.contracts.deploy);
            Object.keys(compiledContracts).forEach((className) => {
              if (deployKeys.includes(className)) {
                realContracts[className] = compiledContracts[className];
              }
            });
            events.request("contracts:build", cfg, realContracts, next);
          },
          (contractsList, contractDeps, next) => {
            events.request("deployment:contracts:deploy", contractsList, contractDeps, next);
          },
          (_result, next) => {
            events.request("contracts:list", next);
          },
          (contracts, next) => {
            for(const contract of contracts) {
              const instance = EmbarkJS.Blockchain.Contract(contract);

              // Here we switch the prototype of the instance we had lying around to the more
              // complete web3 contract instance (with some methods of our own.) Despite this
              // looking hacky, it's necessary. As mocha tests look something like this:
              //
              //   const SimpleStorage = require('Embark/contracts/SimpleStorage');
              //
              //   config({
              //     contracts: {
              //       SimpleStorage: { args: [100] }
              //     }
              //   }, (err, accounts) => {
              //
              //   });
              //
              // it means that we have to return something before the address is set. So,
              // due to that constraint, the only sane way to modify the object the test
              // file is hanging on to is to replace the prototype instead of switching
              // it around and having the test losing the reference.
              if (!compiledContracts[contract.className]) {
                compiledContracts[contract.className] = {};
              }
              instance.options.from = accounts[0];
              instance.options.code = contract.code;
              instance.options.gas = GAS_LIMIT;
              Object.setPrototypeOf(compiledContracts[contract.className], instance);
            }

            next();
          }
        ], (err) => {
          // Reset the gas accumulator so that we don't show deployment gas on the
          // first test.
          reporter.resetGas();

          if (acctCb) {
            acctCb(err, accounts);
          }

          events.emit('tests:ready', accounts);
          done(err);
        });
      });
    };

    const provider = await this.events.request2("tests:blockchain:start", this.options);
    this.web3 = new Web3(provider);
    accounts = await this.web3.eth.getAccounts();

    await events.request2("contracts:reset");
    let contractFiles = await events.request2("config:contractsFiles");

    async.waterfall([
      (next) => {
        this.plugins.emitAndRunActionsForEvent('tests:contracts:compile:before', contractFiles, next);
      },
      (_contractFiles, next) => {
        contractFiles = _contractFiles;
        events.request("compiler:contracts:compile", _contractFiles, next);
      },
      (_compiledContracts, next) => {
        this.plugins.emitAndRunActionsForEvent('tests:contracts:compile:after', _compiledContracts, next);
      },
      (_compiledContracts, next) => {
        compiledContracts = _compiledContracts;
        const fns = this.files.map((file) => {
          return (seriesCb) => {

            this.fs.readFile(file, (err, data) => {
              if (err) {
                this.logger.error(__('Error reading file %s', file));
                this.logger.error(err);
                seriesCb(null, 1);
              }
              if (data.toString().search(/contract\(|describe\(/) === -1) {
                return seriesCb(null, 0);
              }

              let testRunner = this;

              Module.prototype.require = function(req) {
                if (["Embark/EmbarkJS", "EmbarkJS"].includes(req)) {
                  testRunner.logger.warn(
                    `${__('WARNING!')} ${__('Use')} ${`artifacts.require('EmbarkJS')`.cyan}, ${__('the syntax').yellow} ${`require('${req}')`.cyan} ${__('has been deprecated and will be removed in future versions').yellow}`
                  );
                  return MochaTestRunner.requireArtifact("EmbarkJS");
                }

                const prefix = "Embark/contracts/";
                if (req.startsWith(prefix)) {
                  const artifactName = req.replace(prefix, "");
                  testRunner.logger.warn(
                    `${__('WARNING!')} ${__('Use')} ${`artifacts.require('${artifactName}')`.cyan}, ${__('the syntax').yellow} ${`require('${req}')`.cyan} ${__('has been deprecated and will be removed in future versions').yellow}`
                  );
                  return MochaTestRunner.requireArtifact(
                    artifactName,
                    compiledContracts
                  );
                }

                return MochaTestRunner.originalRequire.call(this, req);
              };

              const mocha = new Mocha();
              mocha.reporter(Reporter, {reporter: options.reporter});
              const describeWithAccounts = (scenario, cb) => {
                Mocha.describe(scenario, cb.bind(mocha, accounts));
              };

              mocha.suite.on('pre-require', () => {
                global.describe = describeWithAccounts;
                global.contract = describeWithAccounts;
                global.config = config;
              });

              global.artifacts = {
                require: (artifactName) => MochaTestRunner.requireArtifact(
                  artifactName,
                  compiledContracts
                )
              };

              mocha.suite.timeout(TEST_TIMEOUT);
              mocha.addFile(file);

              mocha.run((failures) => {
                Module.prototype.require = MochaTestRunner.originalRequire;
                seriesCb(null, failures);
              });
            });
          };
        });

        async.series(fns, next);
      }
    ], (err) => {
      this.embark.config.plugins.runActionsForEvent('tests:finished', () => {
        Module.prototype.require = MochaTestRunner.originalRequire;
        cb(err);
      });

    });
  }
}

module.exports = MochaTestRunner;
