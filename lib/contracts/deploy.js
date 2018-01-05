let async = require('async');
//require("../utils/debug_util.js")(__filename, async);

let RunCode = require('../core/runCode.js');

let DeployTracker = require('./deploy_tracker.js');
let CodeGenerator = require('./code_generator.js');

class Deploy {
  constructor(options) {
    this.web3 = options.web3;
    this.contractsManager = options.contractsManager;
    this.logger = options.logger;
    this.env = options.env;
    this.chainConfig = options.chainConfig;
  }

  initTracker(cb) {
    this.deployTracker = new DeployTracker({
      logger: this.logger, chainConfig: this.chainConfig, web3: this.web3, env: this.env
    }, cb);
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

    realArgs = self.determineArguments(params || contract.args);

    if (contract.address !== undefined) {
      contract.deployedAddress = contract.address;
      if (this.deployTracker) {
        self.deployTracker.trackContract(contract.className, contract.realRuntimeBytecode, realArgs, contract.address);
        self.deployTracker.save();
      }
      self.logger.contractsState(self.contractsManager.contractsState());
      return callback();
    }

    if (!this.deployTracker) {
        return self.contractToDeploy(contract, params, callback);
    }

    let trackedContract = self.deployTracker.getContract(contract.className, contract.realRuntimeBytecode, realArgs);
    if (!trackedContract) {
        return self.contractToDeploy(contract, params, callback);
    }

    this.web3.eth.getCode(trackedContract.address, function(_getCodeErr, codeInChain) {
      if (codeInChain !== "0x") {
        self.contractAlreadyDeployed(contract, trackedContract, callback);
      } else {
        self.contractToDeploy(contract, params, callback);
      }
    });
  }

  contractAlreadyDeployed(contract, trackedContract, callback) {
    const self = this;
    self.logger.info(contract.className.bold.cyan + " already deployed at ".green + trackedContract.address.bold.cyan);
    contract.deployedAddress = trackedContract.address;
    self.logger.contractsState(self.contractsManager.contractsState());

    // always run contractCode so other functionality like 'afterDeploy' can also work
    let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
    let contractCode = codeGenerator.generateContractCode(contract);
    RunCode.doEval(contractCode, self.web3);

    return callback();
  }

  contractToDeploy(contract, params, callback) {
    const self = this;
    let realArgs = self.determineArguments(params || contract.args);

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

        let contractCode = codeGenerator.generateContractCode(contract);
        RunCode.doEval(contractCode, self.web3);

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

        // TODO: convert to for to avoid repeated callback
        for(let cmd of onDeployCode) {
          self.logger.info("executing: " + cmd);
          try {
            RunCode.doEval(cmd, self.web3);
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
            }
            return callback(new Error(e));
          }
        }
      }

      callback();
    });
  }

  deployContract(contract, params, callback) {
    let self = this;

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

      let contractObject = new self.web3.eth.Contract(contract.abiDefinition);
      let deployObject;

      //if (contractParams === [] ||  contractParams === undefined || contractParams.length === 0) {
      //  console.dir("no params");
      //  deployObject = contractObject.deploy({data: "0x" + contractCode});
      //} else {
      try {
        deployObject = contractObject.deploy({arguments: contractParams, data: "0x" + contractCode});
      } catch(e) {
        if (e.indexOf('Invalid number of parameters for "undefined"') >= 0) {
          return callback(new Error("attempted to deploy " + contractObject.className + " without specifying parameters"));
        } else {
          return callback(new Error(e));
        }
      }
      //}

      ////  // TODO: probably needs to be defaultAccount
      ////  // TODO: it wouldn't necessary be the first address
      ////  // use defined blockchain address or first address
      ////  contractParams.push({
      ////    //from: this.web3.eth.coinbase,
      ////    from: accounts[0],
      ////    data: "0x" + contractCode,
      ////    gas: contract.gas,
      ////    gasPrice: contract.gasPrice
      ////  });

      self.logger.info("deploying " + contract.className.bold.cyan + " with ".green + contract.gas + " gas".green);

      deployObject.send({
        from: accounts[0],
        gas: contract.gas,
        gasPrice: contract.gasPrice
      }).on('receipt', function(receipt) {
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
        } else if (receipt.contractAddress !== undefined) {
          self.logger.info(contract.className.bold.cyan + " deployed at ".green + receipt.contractAddress.bold.cyan);
          contract.deployedAddress = receipt.contractAddress;
          contract.transactionHash = receipt.transactionHash;
          self.logger.contractsState(self.contractsManager.contractsState());
          return callback(null, receipt.contractAddress);
        }
        self.logger.contractsState(self.contractsManager.contractsState());
      });

      //contractObject["new"].apply(contractObject, contractParams);
      //contractObject["deploy"].apply(contractObject, contractParams);
      //contractObject["deploy"].apply(contractObject, {arguments: contractParams});
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
          console.dir(err);
        }
        self.logger.info("finished deploying contracts");
        self.logger.trace(arguments);
        done(err);
      }
    );

  }
}

module.exports = Deploy;
