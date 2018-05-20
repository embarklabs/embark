let RunCode = require('../../core/runCode.js');

class SpecialConfigs {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.addCheck = options.addCheck;
    this.embark = embark;
    this.contractsConfig = embark.config.contractsConfig;

    this.registerAfterDeployAction();
  }

  registerAfterDeployAction() {
    const self = this;

    this.embark.registerAfterAllContractsDeploy((cb) => {
      let afterDeployCmds = self.contractsConfig.afterDeploy || [];

      let withErrors = false;
      let regex = /\$\w+/g;
      let onDeployCode = afterDeployCmds.map((cmd) => {
        let realCmd = cmd.replace(regex, (match) => {
          let referedContractName = match.slice(1);
          let referedContract = self.contractsManager.getContract(referedContractName);
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
        return cb(new Error("error running afterDeploy"));
      }

      // TODO: convert to for to avoid repeated callback
      for(let cmd of onDeployCode) {
        self.logger.info("executing: " + cmd);
        try {
          RunCode.doEval(cmd, self.blockchain.web3);
        } catch(e) {
          if (e.message.indexOf("invalid opcode") >= 0) {
            self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
          }
          return cb(new Error(e));
        }
      }

      cb();
    });
  }

}

module.exports = SpecialConfigs;
