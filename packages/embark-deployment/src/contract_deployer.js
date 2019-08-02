import { __ } from 'embark-i18n';
const async = require('async');

class ContractDeployer {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.deployer = {};
    this.events.setCommandHandler("deployment:deployer:register", (blockchainType, deployerCb) => {
      this.deployer[blockchainType] = deployerCb
    });

    this.events.setCommandHandler('deployment:contract:deploy', this.deployContract.bind(this));
  }

  deployContract(contract, callback) {
    if (contract.deploy === false) {
      this.events.emit("deployment:contract:undeployed", contract);
      return callback();
    }

    async.waterfall([
      (next) => {
        this.plugins.emitAndRunActionsForEvent('deployment:contract:beforeDeploy', {contract: contract}, (err, _params) => {
          next(err);
        });
      },
      (next) => {
        // self.plugins.emitAndRunActionsForEvent('deployment:contract:arguments', {contract: contract}, (_params) => {
        this.plugins.emitAndRunActionsForEvent('deployment:contract:shouldDeploy', {contract: contract, shouldDeploy: true}, (_params) => {
          next();
        });
      },
      (next) => {
        if (contract.deploy === false) {
          this.events.emit("deployment:contract:undeployed", contract);
          return next();
        }

        console.dir("deploying contract");
        console.dir(contract.className);
        // this.deployer[contract.blockchainType].apply(this.deployer, [contract, next])
        this.deployer["ethereum"].apply(this.deployer, [contract, next])
        // next();
      },
      (next) => {
        console.dir("-------> contract deployed")
        if (contract.deploy === false) return next();
        console.dir("-------> contract deployed 2")
        this.plugins.emitAndRunActionsForEvent('deployment:contract:deployed', {contract: contract}, (_params) => {
          next();
        });
      }
    ], callback);
  }

}

module.exports = ContractDeployer;
