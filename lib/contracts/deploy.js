let async = require('async');

let RunCode = require('../core/runCode.js');

let DeployTracker = require('./deploy_tracker.js');
let CodeGenerator = require('./code_generator.js');

class Deploy {
  constructor(options) {
    this.web3 = options.web3;
    this.contractsManager = options.contractsManager;
    this.logger = options.logger;
    this.env = options.env;

    this.deployTracker = new DeployTracker({
      logger: options.logger, chainConfig: options.chainConfig, web3: options.web3, env: this.env
    });
  }

  determineArguments(suppliedArgs) {
    let realArgs = [], l, arg, contractName, referedContract;

    for (l = 0; l < suppliedArgs.length; l++) {
      arg = suppliedArgs[l];
      if (arg[0] === "$") {
        contractName = arg.substr(1);
        referedContract = this.contractsManager.getContract(contractName);
        realArgs.push(referedContract.deployedAddress);
      } else {
        realArgs.push(arg);
      }
    }

    return realArgs;
  }

  checkAndDeployContract(contract, params, callback) {
    let self = this;
    let realArgs;
    contract.error = false;

    if (contract.deploy === false) {
      self.logger.contractsState(self.contractsManager.contractsState());
      return callback();
    }

    if (contract.address !== undefined) {

      realArgs = self.determineArguments(params || contract.args);

      contract.deployedAddress = contract.address;
      self.deployTracker.trackContract(contract.className, contract.realRuntimeBytecode, realArgs, contract.address);
      self.deployTracker.save();
      self.logger.contractsState(self.contractsManager.contractsState());
      return callback();
    }

    let trackedContract = self.deployTracker.getContract(contract.className, contract.realRuntimeBytecode, contract.args);

    if (trackedContract && this.web3.eth.getCode(trackedContract.address) !== "0x") {
      self.logger.info(contract.className.bold.cyan + " already deployed at ".green + trackedContract.address.bold.cyan);
      contract.deployedAddress = trackedContract.address;
      self.logger.contractsState(self.contractsManager.contractsState());

      // always run contractCode so other functionality like 'afterDeploy' can also work
      let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
      let contractCode = codeGenerator.generateContractCode(contract);
      RunCode.doEval(contractCode, self.web3);

      return callback();
    } else {

      realArgs = self.determineArguments(params || contract.args);

      this.deployContract(contract, realArgs, function (err, address) {
        if (err) {
          return callback(new Error(err));
        }
        self.deployTracker.trackContract(contract.className, contract.realRuntimeBytecode, realArgs, address);
        self.deployTracker.save();
        self.logger.contractsState(self.contractsManager.contractsState());

        // always run contractCode so other functionality like 'afterDeploy' can also work
        let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
        let contractCode = codeGenerator.generateContractCode(contract);
        RunCode.doEval(contractCode, self.web3);

        if (contract.onDeploy !== undefined) {
          self.logger.info('executing onDeploy commands');

          let cmds = "";
          cmds += codeGenerator.generateContractCode(contract);

          let withErrors = false;
          let regex = /\$\w+/g;
          let onDeployCode = contract.onDeploy.map((cmd) => {
            let realCmd = cmd.replace(regex, (match) => {
                let referedContractName = match.slice(1);
                let referedContract = self.contractsManager.getContract(referedContractName);
                if (!referedContract) {
                  self.logger.error('error executing onDeploy for ' + contract.className);
                  self.logger.error(referedContractName + ' does not exist');
                  self.logger.error("error running onDeploy: " + cmd);
                  withErrors = true;
                  return;
                }
                if (referedContract && referedContract.deploy === false) {
                  self.logger.error('error executing onDeploy for ' + contract.className);
                  self.logger.error(referedContractName + " exists but has been set to not deploy");
                  self.logger.error("error running onDeploy: " + cmd);
                  withErrors = true;
                  return;
                }
                if (referedContract && !referedContract.deployedAddress) {
                  self.logger.error('error executing onDeploy for ' + contract.className);
                  self.logger.error("couldn't find a valid address for " + referedContractName + ". has it been deployed?");
                  self.logger.error("error running onDeploy: " + cmd);
                  withErrors = true;
                  return;
                }
                return referedContract.deployedAddress;
            });
            return realCmd;
          });

          if (withErrors) {
            contract.error = "onDeployCmdError";
            return callback(new Error("error running onDeploy"));
          }

          cmds += onDeployCode.join(';\n');

          RunCode.doEval(cmds, self.web3);
        }

        callback();
      });
    }

  }

  deployContract(contract, params, callback) {
    let self = this;
    let contractObject = this.web3.eth.contract(contract.abiDefinition);

    let contractParams = (params || contract.args).slice();

    this.web3.eth.getAccounts(function (err, accounts) {
      if (err) {
        return callback(new Error(err));
      }

      let contractCode = contract.code;
      let contractsList = self.contractsManager.listContracts();
      for (let contractObj of contractsList) {
        let filename = contractObj.filename;
        let deployedAddress = contractObj.deployedAddress;
        if (deployedAddress) {
          deployedAddress = deployedAddress.substr(2);
        }
        let linkReference = '__' + filename + ":" + contractObj.className;
        if (contractCode.indexOf(linkReference) < 0) {
          continue;
        }
        if (linkReference.length > 40) {
          return callback(new Error(linkReference + " is too long, try reducing the path of the contract (" + filename + ") and/or its name " + contractObj.className));
        }
        let toReplace = linkReference + "_".repeat(40 - linkReference.length);
        if (deployedAddress === undefined) {
          let libraryName = contractObj.className;
          return callback(new Error(contract.className + " needs " + libraryName + " but an address was not found, did you deploy it or configured an address?"));
        }
        contractCode = contractCode.replace(new RegExp(toReplace, "g"), deployedAddress);
      }

      // TODO: probably needs to be defaultAccount
      // TODO: it wouldn't necessary be the first address
      // use defined blockchain address or first address
      contractParams.push({
        //from: this.web3.eth.coinbase,
        from: accounts[0],
        data: "0x" + contractCode,
        gas: contract.gas,
        gasPrice: contract.gasPrice
      });

      self.logger.info("deploying " + contract.className.bold.cyan + " with ".green + contract.gas + " gas".green);

      contractParams.push(function (err, transaction) {

        if (err) {
          self.logger.error("error deploying contract: " + contract.className.cyan);
          let errMsg = err.toString();
          if (errMsg === 'Error: The contract code couldn\'t be stored, please check your gas amount.') {
            errMsg = 'The contract code couldn\'t be stored, out of gas or constructor error';
          }
          self.logger.error(errMsg);
          contract.error = errMsg;
          self.logger.contractsState(self.contractsManager.contractsState());
          return callback(new Error(err));
        } else if (transaction.address !== undefined) {
          self.logger.info(contract.className.bold.cyan + " deployed at ".green + transaction.address.bold.cyan);
          contract.deployedAddress = transaction.address;
          contract.transactionHash = transaction.transactionHash;
          self.logger.contractsState(self.contractsManager.contractsState());
          return callback(null, transaction.address);
        }
      });
      self.logger.contractsState(self.contractsManager.contractsState());

      contractObject["new"].apply(contractObject, contractParams);
    });
  }

  deployAll(done) {
    let self = this;
    this.logger.info("deploying contracts");

    async.eachOfSeries(this.contractsManager.listContracts(),
      function (contract, key, callback) {
        self.logger.trace(arguments);
        self.checkAndDeployContract(contract, null, callback);
      },
      function (err, _results) {
        if (err) {
          self.logger.error("error deploying contracts");
          self.logger.error(err.message);
          self.logger.debug(err.stack);
        }
        self.logger.info("finished deploying contracts");
        self.logger.trace(arguments);
        done(err);
      }
    );

  }
}

module.exports = Deploy;
