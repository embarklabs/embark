import { __ } from 'embark-i18n';
const async = require('async');
const stringReplaceAsync = require('string-replace-async');
const {callbackify} = require('util');

class ListConfigs {
  constructor(embark) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.config = embark.config;
  }

  beforeAllDeployAction(cb) {
    return cb();
  }

  async afterAllDeployAction(cb) {
    let afterDeployCmds = this.config.contractsConfig.afterDeploy || [];
    async.mapLimit(afterDeployCmds, 1, (cmd, nextMapCb) => {
      async.waterfall([
        (next) => {
          this.replaceWithAddresses(cmd, next);
        },
        this.replaceWithENSAddress.bind(this)
      ], nextMapCb);
    }, (err, onDeployCode) => {
      if (err) {
        this.logger.trace(err);
        return cb(new Error("error running afterDeploy"));
      }

      this.runOnDeployCode(onDeployCode, cb);
    });
  }

  async doOnDeployAction(contract, cb) {
    let onDeployCmds = contract.onDeploy;
    async.mapLimit(onDeployCmds, 1, (cmd, nextMapCb) => {
      async.waterfall([
        (next) => {
          this.replaceWithAddresses(cmd, next);
        },
        this.replaceWithENSAddress.bind(this)
      ], (err, code) => {
        if (err) {
          this.logger.error(err.message || err);
          return nextMapCb(); // Don't return error as we just skip the failing command
        }
        nextMapCb(null, code);
      });
    }, (err, onDeployCode) => {
      if (err) {
        return cb(new Error("error running onDeploy for " + contract.className.cyan));
      }

      this.runOnDeployCode(onDeployCode, cb, contract.silent);
    });
  }

  async deployIfAction(params, cb) {
    let cmd = params.contract.deployIf;
    this.events.request('runcode:eval', cmd, (err, result) => {
      if (err) {
        this.logger.error(params.contract.className + ' deployIf directive has an error; contract will not deploy');
        this.logger.error(err.message || err);
        params.shouldDeploy = false;
      } else if (!result) {
        this.logger.info(params.contract.className + ' deployIf directive returned false; contract will not deploy');
        params.shouldDeploy = false;
      }

      cb(null, params);
    });
  }

  runOnDeployCode(onDeployCode, callback, silent) {
    const logFunction = silent ? this.logger.trace.bind(this.logger) : this.logger.info.bind(this.logger);
    async.each(onDeployCode, (cmd, eachCb) => {
      if (!cmd) {
        return eachCb();
      }
      logFunction("==== executing: " + cmd);
      this.events.request('runcode:eval', cmd, (err) => {
        if (err && err.message.indexOf("invalid opcode") >= 0) {
          this.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
        }
        eachCb(err);
      });
    }, callback);
  }

  replaceWithENSAddress(cmd, callback) {
    const replaceWithENSAddress = (cmd) => {
      let regex = /\'[a-zA-Z0-9.]+\.eth\'/g;
      return stringReplaceAsync.seq(cmd, regex, (ensDomain) => {
        ensDomain = ensDomain.slice(1, ensDomain.length - 1);
        return (new Promise((resolve, reject) => {
          this.events.request("namesystem:resolve", ensDomain, (err, address) => {
            if (err) {
              return reject(new Error(err));
            }
            address = `'${address}'`;
            return resolve(address);
          });
        }));
      });
    };

    if (callback) {
      return callbackify(replaceWithENSAddress)(cmd, callback);
    }
    return replaceWithENSAddress(cmd);
  }

  replaceWithAddresses(cmd, callback) {
    const replaceWithAddresses = (cmd) => {
      let regex = /\$\w+\[?\d?\]?/g;
      return stringReplaceAsync.seq(cmd, regex, (match, index) => {
        return (new Promise((resolve, reject) => {
          if (match.startsWith('$accounts')) {
            let accountIndex = cmd.substring(index + 10, index + 12);
            accountIndex = parseInt(accountIndex, 10);
            return this.events.request('blockchain:getAccounts', (err, accounts) => {
              if (err) {
                return reject('Error getting accounts: ' + err.message || err);
              }
              if (!accounts[accountIndex]) {
                return reject(__('No corresponding account at index %d', accountIndex));
              }
              resolve(accounts[accountIndex]);
            });
          }

          let referedContractName = match.slice(1);
          this.events.request('contracts:contract', referedContractName, (_err, referedContract) => {
            if (!referedContract) {
              this.logger.error(referedContractName + ' does not exist');
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContractDoesNotExist"));
            }
            if (referedContract && referedContract.deploy === false) {
              this.logger.error(referedContractName + " exists but has been set to not deploy");
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContracSetToNotdeploy"));
            }
            if (referedContract && !referedContract.deployedAddress) {
              this.logger.error(
                "couldn't find a valid address for " + referedContractName + ". has it been deployed?"
              );
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContractAddressNotFound"));
            }
            return resolve(referedContract.deployedAddress);
          });
        }));
      });
    };

    if (callback) {
      return callbackify(replaceWithAddresses)(cmd, callback);
    }
    return replaceWithAddresses(cmd);
  }

}

module.exports = ListConfigs;
