let async = require('async');
//require("../utils/debug_util.js")(__filename, async);
let Deploy = require('./deploy.js');
let RunCode = require('../core/runCode.js');

class DeployManager {
  constructor(options) {
    this.config = options.config;
    this.logger = options.logger;
    this.blockchainConfig = this.config.blockchainConfig;

    this.events = options.events;
    this.plugins = options.plugins;
    this.web3 = options.web3;
    this.chainConfig = (options.trackContracts !== false) ? this.config.chainTracker : false;
    this.contractsManager = options.contractsManager;
    this.gasLimit = false;
    this.fatalErrors = false;
    this.deployOnlyOnConfig = false;
    this.onlyCompile = options.onlyCompile !== undefined ? options.onlyCompile : false;
  }

  deployContracts(done) {
    let self = this;

    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      self.logger.info("Blockchain component is disabled in the config".underline);
      this.events.emit('blockchainDisabled', {});
      return done();
    }

    async.waterfall([
      function buildContracts(callback) {
        self.contractsManager.deployOnlyOnConfig = self.deployOnlyOnConfig; // temporary, should refactor
        self.contractsManager.build(callback);
      },
      function checkCompileOnly(contractsManager, callback){
        if(self.onlyCompile){
          self.events.emit('contractsDeployed', contractsManager);
          return done();
        } 
        return callback(null, contractsManager);
      },
      function checkWeb3IsConnected(contractsManager, callback) {
        if (!self.web3) {
          return callback(Error("no web3 instance found"));
        }

        if (self.web3.currentProvider === undefined) {
          self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
          self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
          return callback(Error("error connecting to blockchain node"));
        }

        self.web3.eth.getAccounts(function(err, _accounts) {
          if (err) {
            self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
            self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
            return callback(Error("error connecting to blockchain node"));
          }
          return callback(null, contractsManager, self.web3);
        });
      },
      function setDefaultAccount(contractsManager, web3, callback) {
        web3.eth.getAccounts(function (err, accounts) {
          if (err) {
            self.logger.error(err);
            return callback(new Error(err));
          }
          let accountConfig = self.config.blockchainConfig.account;
          let selectedAccount = accountConfig && accountConfig.address;
          web3.eth.defaultAccount = (selectedAccount || accounts[0]);
          callback(null, contractsManager, web3);
        });
      },
      function deployAllContracts(contractsManager, web3, callback) {
        let deploy = new Deploy({
          web3: web3,
          contractsManager: contractsManager,
          logger: self.logger,
          events: self.events,
          chainConfig: self.chainConfig,
          env: self.config.env,
          plugins: self.plugins,
          gasLimit: self.gasLimit
        });

        deploy.initTracker(function() {
          deploy.deployAll(function (err) {
            if (!err) {
              self.events.emit('contractsDeployed', contractsManager);
            }
            if (err && self.fatalErrors) {
              return callback(err);
            }
            callback(null, contractsManager, web3);
          });
        });
      },
      function runAfterDeployCommands(contractsManager, web3, callback) {
        let afterDeployCmds = self.config.contractsConfig.afterDeploy || [];

        let withErrors = false;
        let regex = /\$\w+/g;
        let onDeployCode = afterDeployCmds.map((cmd) => {
          let realCmd = cmd.replace(regex, (match) => {
            let referedContractName = match.slice(1);
            let referedContract = contractsManager.getContract(referedContractName);
            if (!referedContract) {
              self.logger.error(referedContractName + ' does not exist');
              self.logger.error("error running afterDeploy: " + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && referedContract.deploy === false) {
              self.logger.error(referedContractName + " exists but has been set to not deploy");
              self.logger.error("error running afterDeploy: " + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && !referedContract.deployedAddress) {
              self.logger.error("couldn't find a valid address for " + referedContractName + ". has it been deployed?");
              self.logger.error("error running afterDeploy: " + cmd);
              withErrors = true;
              return;
            }
            return referedContract.deployedAddress;
          });
          return realCmd;
        });

        if (withErrors) {
          return callback(new Error("error running afterDeploy"));
        }

        // TODO: convert to for to avoid repeated callback
        for(let cmd of onDeployCode) {
          self.logger.info("executing: " + cmd);
          try {
            RunCode.doEval(cmd, web3);
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
            }
            return callback(new Error(e));
          }
        }

        callback(null, contractsManager);
      }
    ], function (err, result) {
      if (err) {
        done(err, null);
      } else {
        done(null, result);
      }
    });
  }

}

module.exports = DeployManager;
