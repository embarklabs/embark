import {__} from 'embark-i18n';
import {deconstructUrl, buildUrl, recursiveMerge} from 'embark-utils';
import cloneDeep from 'lodash.clonedeep';
import fs from 'fs';

const assert = require('assert').strict;
const async = require('async');
const Mocha = require('mocha');
const Web3 = require('web3');

const Reporter = require('./reporter');

const JAVASCRIPT_TEST_MATCH = /^.+\.js$/i;
const TEST_TIMEOUT = 0; // 15 seconds in milliseconds

class MochaTestRunner {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.configObj = embark.config;
    this.originalConfigObj = cloneDeep(embark.config);

    this.files = [];
    this.simOptions = {};
    this.options = {};
    this.web3 = null;

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

  async checkDeploymentOptions(options) {
    let resetServices = false;
    const blockchainConfig = options.blockchain || {};
    const {host, port, type, protocol} = blockchainConfig.endpoint ? deconstructUrl(blockchainConfig.endpoint) : {};
    const accounts = blockchainConfig.accounts;

    if (host && port && !['rpc', 'ws'].includes(type)) {
      throw new Error(__("contracts config error: unknown deployment type %s", type));
    }

    if (this.options.coverage && type === 'rpc') {
      this.logger.warn(__('Coverage does not work with an RPC node'));
      this.logger.warn(__('You can change to a WS node (`"type": "ws"`) or use the simulator (no node or `"type": "vm"`)'));
    }

    if (accounts || port !== this.simOptions.port || type !== this.simOptions.type || host !== this.simOptions.host) {
      resetServices = true;
    }

    Object.assign(this.simOptions, {host, port, type, protocol});
    this.simOptions.accounts = accounts;

    if (!resetServices) {
      return;
    }

    await this.startBlockchainNode();
  }

  async startBlockchainNode() {
    let node = this.options.node;
    if (!this.simOptions.host && (node && node === 'vm')) {
      this.simOptions.type = 'vm';
    } else if (this.simOptions.host || (node && node !== 'vm')) {
      let options = this.simOptions;
      if (node && node !== 'vm') {
        options = deconstructUrl(node);
      }

      if (!options.protocol) {
        options.protocol = (options.type === "rpc") ? 'http' : 'ws';
      }
      Object.assign(this.simOptions, options);
      node = null;
    }

    this.configObj.blockchainConfig = recursiveMerge({}, this.originalConfigObj.blockchainConfig, {
      endpoint: this.simOptions.host ? buildUrl(this.simOptions.protocol, this.simOptions.host, this.simOptions.port, this.simOptions.type) : null,
      type: this.simOptions.type,
      accounts: this.simOptions.accounts,
      coverage: this.options.coverage
    });
    this.logger.trace('Setting blockchain configs:', this.configObj.blockchainConfig);
    await this.events.request2('config:blockchainConfig:set', this.configObj.blockchainConfig);

    try {
      await this.events.request2("blockchain:node:stop");
    } catch (e) {
      // Nothing to do here, the node probably wasn't even started
    }

    await this.events.request2("blockchain:node:start", this.configObj.blockchainConfig, node);
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    if (!this.web3) {
      this.web3 = new Web3();
    }
    this.web3.setProvider(provider);
  }

  async run(options, cb) {
    const {events} = this.embark;
    this.options = options;

    const Module = require("module");
    const originalRequire = require("module").prototype.require;

    let accounts = [];
    let compiledContracts = {};

    const config = (cfg, acctCb) => {
      global.before((done) => {
        async.waterfall([
          (next) => {
            this.checkDeploymentOptions(cfg)
              .then(next)
              .catch(next);
          },
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
              const contractObj = new this.web3.eth.Contract(instance.abiDefinition, contract.deployedAddress);
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

    await this.startBlockchainNode();
    accounts = await this.web3.eth.getAccounts();
    await events.request2("contracts:reset");
    const contractFiles = await events.request2("config:contractsFiles");
    compiledContracts = await events.request2("compiler:contracts:compile", contractFiles);

    let fns = this.files.map((file) => {
      return (seriesCb) => {
        fs.readFile(file, (err, data) => {
          if (err) {
            self.logger.error(__('Error reading file %s', file));
            self.logger.error(err);
            seriesCb(null, 1);
          }

          if (data.toString().search(/contract\(|describe\(/) === -1) {
            return seriesCb(null, 0);
          }

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

          const mocha = new Mocha();

          mocha.reporter(Reporter, {reporter: options.reporter});
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
          mocha.addFile(file);

          mocha.run((failures) => {
            Module.prototype.require = originalRequire;
            seriesCb(null, failures);
          });
        });
      };
    });

    async.series(fns, cb);
  }
}

module.exports = MochaTestRunner;
