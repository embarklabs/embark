import { __ } from 'embark-i18n';
const async = require('async');

const ContractDeployer = require('./contract_deployer.js');
const cloneDeep = require('clone-deep');
const constants = require('embark-core/constants');

class Deployment {
  constructor(embark, options) {
    this.config = embark.config;
    this.events = embark.events;
    this.logger = embark.logger;
    this.plugins = options.plugins;
    this.blockchainConfig = this.config.blockchainConfig;

    this.contractDeployer = new ContractDeployer({
      events: this.events,
      plugins: this.plugins
    });

    this.events.setCommandHandler('deployment:contracts:deploy', (contractsList, contractDependencies, cb) => {
      this.deployContracts(contractsList, contractDependencies, cb);
    });
  }

  deployContracts(contracts, contractDependencies, done) {
    this.logger.info(__("deploying contracts"));
    async.waterfall([
      // TODO used to be called this.plugins.emitAndRunActionsForEvent("deploy:beforeAll", (err) => {
      (next) => { this.plugins.emitAndRunActionsForEvent('deployment:deployContracts:beforeAll', () => { next() }); },
      (next) => { this.deployAll(contracts, contractDependencies, () => { next() }); },
      (next) => {
        this.events.emit('contractsDeployed');
        this.plugins.emitAndRunActionsForEvent('deployment:deployContracts:afterAll', () => { next() });
        console.dir("==== finished deploying");
      }
    ], done);
  }

  deployContract(contract, callback) {
    console.dir("requesting to deploy contract")
    this.events.request('deployment:contract:deploy', contract, (err) => {
      if (err) {
        contract.error = err.message || err;
        if (contract.error === constants.blockchain.gasAllowanceError) {
          this.logger.error(`[${contract.className}]: ${constants.blockchain.gasAllowanceErrorMessage}`);
        } else {
          this.logger.error(`[${contract.className}]: ${err.message || err}`);
        }
        errors.push(err);
      }
      callback();
    });
  }

  deployAll(contracts, contractDependencies, done) {
    const self = this;
    console.dir("doing deployAll")
    const contractDeploys = {};
    const errors = [];

    Object.values(contracts).forEach((contract) => {
      function deploy(result, callback) {
        console.dir("== deploy")
        if (typeof result === 'function') callback = result;
        self.deployContract(contract, callback);
      }

      const className = contract.className;
      if (!contractDependencies[className] || contractDependencies[className].length === 0) {
        contractDeploys[className] = deploy;
        return;
      }
      contractDeploys[className] = cloneDeep(contractDependencies[className]);
      contractDeploys[className].push(deploy);
    })

    async.auto(contractDeploys, (_err, _results) => {
      if (_err) {
        console.dir("error deploying contracts")
        console.dir(_err)
      }
      if (errors.length) {
        _err = __("Error deploying contracts. Please fix errors to continue.");
        this.logger.error(_err);
        this.events.emit("outputError", __("Error deploying contracts, please check console"));
        return done(_err);
      }
      if (contracts.length === 0) {
        this.logger.info(__("no contracts found"));
        return done();
      }
      this.logger.info(__("finished deploying contracts"));
      done(_err);
    });
  }

}

module.exports = Deployment;
