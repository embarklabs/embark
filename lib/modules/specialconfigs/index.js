const stringReplaceAsync = require('string-replace-async');
const async = require('async');

class SpecialConfigs {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embark = embark;
    this.contractsConfig = embark.config.contractsConfig;

    this.registerAfterDeployAction();
    this.registerOnDeployAction();
  }

  replaceWithAddresses(cmd, cb) {
    const self = this;
    let regex = /\$\w+/g;
    stringReplaceAsync.seq(cmd, regex, (match) => {
      return (new Promise((resolve, reject) => {
        let referedContractName = match.slice(1);
        self.events.request('contracts:contract', referedContractName, (referedContract) => {
          if (!referedContract) {
            self.logger.error(referedContractName + ' does not exist');
            self.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContractDoesNotExist"));
          }
          if (referedContract && referedContract.deploy === false) {
            self.logger.error(referedContractName + " exists but has been set to not deploy");
            self.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContracSetToNotdeploy"));
          }
          if (referedContract && !referedContract.deployedAddress) {
            self.logger.error("couldn't find a valid address for " + referedContractName + ". has it been deployed?");
            self.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContractAddressNotFound"));
          }
          return resolve(referedContract.deployedAddress);
        });
      }));
    }).then((result) => {
      cb(null, result);
    }).catch(cb);
  }

  registerAfterDeployAction() {
    const self = this;

    this.embark.registerActionForEvent("contracts:deploy:afterAll", (cb) => {
      let afterDeployCmds = self.contractsConfig.afterDeploy || [];

      async.mapLimit(afterDeployCmds, 1, (cmd, nextMapCb) => {
        self.replaceWithAddresses(cmd, nextMapCb);
      }, (err, onDeployCode) => {
        if (err) {
          self.logger.trace(err);
          return cb(new Error("error running afterDeploy"));
        }

        self.runOnDeployCode(onDeployCode, cb);
      });
    });
  }

  runOnDeployCode(onDeployCode, callback) {
    const self = this;
    async.each(onDeployCode, (cmd, eachCb) => {
      self.logger.info("==== executing: " + cmd);
      self.events.request('runcode:eval', cmd, (err) => {
        if (err && err.message.indexOf("invalid opcode") >= 0) {
          self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
        }
        eachCb(err);
      });
    }, callback);
  }

  registerOnDeployAction() {
    const self = this;

    this.embark.registerActionForEvent("deploy:contract:deployed", (params, cb) => {
      let contract = params.contract;

      if (!contract.onDeploy) {
        return cb();
      }

      self.logger.info(__('executing onDeploy commands'));

      let onDeployCmds = contract.onDeploy;

      async.mapLimit(onDeployCmds, 1, (cmd, nextMapCb) => {
        self.replaceWithAddresses(cmd, nextMapCb);
      }, (err, onDeployCode) => {
        if (err) {
          return cb(new Error("error running onDeploy for " + contract.className.cyan));
        }

        self.runOnDeployCode(onDeployCode, cb);
      });
    });
  }

}

module.exports = SpecialConfigs;
