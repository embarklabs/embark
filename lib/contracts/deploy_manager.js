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
    this.blockchain = options.blockchain;
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
      self.logger.info(__("Blockchain component is disabled in the config").underline);
      this.events.emit('blockchainDisabled', {});
      return done();
    }

    async.waterfall([
      function buildContracts(callback) {
        self.contractsManager.deployOnlyOnConfig = self.deployOnlyOnConfig; // temporary, should refactor
        self.contractsManager.build(() => {
          callback();
        });
      },
      function checkCompileOnly(callback){
        if(self.onlyCompile){
          self.events.emit('contractsDeployed', self.contractsManager);
          return done();
        } 
        return callback();
      },

      // TODO: could be implemented as an event (beforeDeployAll)
      function checkIsConnectedToBlockchain(callback) {
        self.blockchain.assertNodeConnection((err) => {
          callback(err);
        });
      },

      // TODO: this can be done on the fly or as part of the initialization
      function determineDefaultAccount(callback) {
        self.blockchain.determineDefaultAccount((err) => {
          callback(err);
        });
      },

      function deployAllContracts(callback) {
        let deploy = new Deploy({
          blockchain: self.blockchain,
          contractsManager: self.contractsManager,
          logger: self.logger,
          events: self.events,
          chainConfig: self.chainConfig,
          env: self.config.env,
          plugins: self.plugins,
          gasLimit: self.gasLimit
        });

        deploy.deployAll(function (err) {
          if (!err) {
            self.events.emit('contractsDeployed', self.contractsManager);
          }
          if (err && self.fatalErrors) {
            return callback(err);
          }
          callback();
        });
      },
      function runAfterDeployCommands(callback) {
        // TODO: should instead emit a afterDeploy event and/or run a afterDeploy plugin
        let afterDeployCmds = self.config.contractsConfig.afterDeploy || [];

        let withErrors = false;
        let regex = /\$\w+/g;
        let onDeployCode = afterDeployCmds.map((cmd) => {
          let realCmd = cmd.replace(regex, (match) => {
            let referedContractName = match.slice(1);
            let referedContract = self.contractsManager.getContract(referedContractName);
            if (!referedContract) {
              self.logger.error(referedContractName + ' does not exist');
              self.logger.error(__("error running afterDeploy: ") + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && referedContract.deploy === false) {
              self.logger.error(referedContractName + " exists but has been set to not deploy");
              self.logger.error(__("error running afterDeploy: ") + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && !referedContract.deployedAddress) {
              self.logger.error("couldn't find a valid address for " + referedContractName + ". has it been deployed?");
              self.logger.error(__("error running afterDeploy: ") + cmd);
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
          self.logger.info(__("executing") + ": " + cmd);
          try {
            RunCode.doEval(cmd, {web3: self.blockchain.web3});
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error(__('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation'));
            }
            return callback(new Error(e));
          }
        }

        callback();
      }
    ], function (err, _result) {
      done(err);
    });
  }

}

module.exports = DeployManager;
