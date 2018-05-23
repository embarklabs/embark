const stringReplaceAsync = require('string-replace-async');
const async = require('async');

class SpecialConfigs {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.addCheck = options.addCheck;
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

    this.embark.registerAfterAllContractsDeploy((cb) => {
      let afterDeployCmds = self.contractsConfig.afterDeploy || [];

      async.mapLimit(afterDeployCmds, 1, (cmd, nextMapCb) => {
        self.replaceWithAddresses(cmd, nextMapCb);
      }, (err, result) => {
        if (err) {
          return cb(new Error("error running afterDeploy"));
        }
        let onDeployCode = result;

        // TODO: convert to for to avoid repeated callback
        for(let cmd of onDeployCode) {
          self.logger.info("==== executing: " + cmd);
          try {
            self.events.request('runcode:eval', cmd);
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
            }
            return cb(new Error(e));
          }
        }
        cb();
      });
    });
  }

  registerOnDeployAction() {
    const self = this;

    this.embark.registerOnDeployContracts((contract, cb) => {
      if (!contract.onDeploy) {
        return cb();
      }

      self.logger.info(__('executing onDeploy commands'));

      let onDeployCmds = contract.onDeploy;

      async.mapLimit(onDeployCmds, 1, (cmd, nextMapCb) => {
        self.replaceWithAddresses(cmd, nextMapCb);
      }, (err, result) => {
        if (err) {
          return cb(new Error("error running onDeploy for " + contract.className.cyan));
        }
        let onDeployCode = result;

        // TODO: convert to for to avoid repeated callback
        for(let cmd of onDeployCode) {
          self.logger.info("==== executing: " + cmd);
          try {
            self.events.request('runcode:eval', cmd);
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
            }
            return cb(new Error(e));
          }
        }
        cb();
      });
    });
  }

}

module.exports = SpecialConfigs;
