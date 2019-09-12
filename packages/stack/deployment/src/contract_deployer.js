const async = require('async');

class ContractDeployer {
  constructor(options) {
    this.events = options.events;
    this.plugins = options.plugins;
    this.deployer = {};
    this.events.setCommandHandler("deployment:deployer:register", (blockchainType, deployerCb) => {
      this.deployer[blockchainType] = deployerCb;
    });

    this.events.setCommandHandler('deployment:contract:deploy', this.deployContract.bind(this));
  }

  deployContract(contract, callback) {
    async.waterfall([
      (next) => {
        this.plugins.emitAndRunActionsForEvent('deployment:contract:beforeDeploy', {contract: contract}, (err, _params) => {
          // TODO: confirm this really works and shouldn't be next(err, params)
          next(err);
        });
      },
      (next) => {
        this.plugins.emitAndRunActionsForEvent('deployment:contract:shouldDeploy', {contract: contract, shouldDeploy: true}, (err, params) => {
          next(err, params);
        });
      },
      (params, next) => {
        if (!params.shouldDeploy) {
          return this.plugins.emitAndRunActionsForEvent('deployment:contract:undeployed', {contract}, (err, _params) => {
            next(err, null);
          });
        }

        // TODO: implement `blockchainType` a la `this.deployer[contract.blockchainType].apply(this.deployer, [contract, next])`
        this.deployer["ethereum"].apply(this.deployer, [
          contract, (err, receipt) => {
            if (!receipt) return next(err);
            this.plugins.emitAndRunActionsForEvent('deployment:contract:deployed', { contract, receipt }, (err, _params) => {
              next(err);
            });
          }
        ]);
      }
    ], (err) => {
      if (err) {
        this.events.emit("deploy:contract:error", contract);
      }
      callback(err);
    });
  }
}

module.exports = ContractDeployer;
