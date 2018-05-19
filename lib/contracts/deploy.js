let async = require('async');
//require("../utils/debug_util.js")(__filename, async);
let utils = require('../utils/utils.js');

let RunCode = require('../core/runCode.js');

let CodeGenerator = require('./code_generator.js');

class Deploy {
  constructor(options) {
    this.blockchain = options.blockchain;
    this.web3 = this.blockchain.web3;
    this.contractsManager = options.contractsManager;
    this.logger = options.logger;
    this.events = options.events;
    this.env = options.env;
    this.chainConfig = options.chainConfig;
    this.plugins = options.plugins;
    this.gasLimit = options.gasLimit;
    
    this.events.setCommandHandler("contracts:contract", (contractName, cb) => {
      cb(this.contractsManager.getContract(contractName));
    });
  }

  determineArguments(suppliedArgs, contract) {
    let realArgs = [], l, arg, contractName, referedContract;

    let args = suppliedArgs;

    if (!Array.isArray(args)) {
      args = [];
      let abi = contract.abiDefinition.find((abi) => abi.type === 'constructor');

      for (let input of abi.inputs) {
        let inputValue = suppliedArgs[input.name];
        if (!inputValue) {
          this.logger.error(__("{{inputName}} has not been defined for {{className}} constructor", {inputName: input.name, className: contract.className}));
        }
        args.push(inputValue || "");
      }
    }

    for (l = 0; l < args.length; l++) {
      arg = args[l];
      if (arg[0] === "$") {
        contractName = arg.substr(1);
        referedContract = this.contractsManager.getContract(contractName);
        realArgs.push(referedContract.deployedAddress);
      } else if (Array.isArray(arg)) {
        let subRealArgs = [];
        for (let sub_arg of arg) {
          if (sub_arg[0] === "$") {
            contractName = sub_arg.substr(1);
            referedContract = this.contractsManager.getContract(contractName);
            subRealArgs.push(referedContract.deployedAddress);
          } else {
            subRealArgs.push(sub_arg);
          }
        }
        realArgs.push(subRealArgs);
      } else {
        realArgs.push(arg);
      }
    }

    return realArgs;
  }

  checkAndDeployContract(contract, params, callback) {
    let self = this;
    contract.error = false;

    if (contract.deploy === false) {
      self.events.emit('contractsState', self.contractsManager.contractsState());
      return callback();
    }

    contract.realArgs = self.determineArguments(params || contract.args, contract);

    if (contract.address !== undefined) {
      try {
        utils.toChecksumAddress(contract.address);
      } catch(e) {
        self.logger.error(__("error deploying %s", contract.className));
        self.logger.error(e.message);
        contract.error = e.message;
        self.events.emit('contractsState', self.contractsManager.contractsState());
        return callback(e.message);
      }
      contract.deployedAddress = contract.address;
      self.logger.info(contract.className.bold.cyan + __(" already deployed at ").green + contract.address.bold.cyan);
      self.events.emit("deploy:contract:deployed", contract);
      self.events.emit('contractsState', self.contractsManager.contractsState());
      return callback();
    }

    //if (!this.deployTracker) {
    //    return self.contractToDeploy(contract, params, callback);
    //}

    // TODO: this should be a plugin API instead, if not existing, it should by default deploy the contract
    self.events.request("deploy:contract:shouldDeploy", contract, function(trackedContract) {
      if (!trackedContract) {
        return self.contractToDeploy(contract, params, callback);
      }

      self.blockchain.getCode(trackedContract.address, function(_getCodeErr, codeInChain) {
        if (codeInChain !== "0x") {
          self.contractAlreadyDeployed(contract, trackedContract, callback);
        } else {
          self.contractToDeploy(contract, params, callback);
        }
      });
    });
  }

  contractAlreadyDeployed(contract, trackedContract, callback) {
    const self = this;
    self.logger.info(contract.className.bold.cyan + __(" already deployed at ").green + trackedContract.address.bold.cyan);
    contract.deployedAddress = trackedContract.address;
    self.events.emit('contractsState', self.contractsManager.contractsState());

    // always run contractCode so other functionality like 'afterDeploy' can also work
    let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
    let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
    RunCode.doEval(contractCode, {web3: self.web3});

    return callback();
  }

  contractToDeploy(contract, params, callback) {
    const self = this;
    contract.realArgs = self.determineArguments(params || contract.args, contract);

    this.deployContract(contract, contract.realArgs, function (err, address) {
      if (err) {
        return callback(new Error(err));
      }
      contract.address = address;
      self.events.emit("deploy:contract:deployed", contract);
      self.events.emit('contractsState', self.contractsManager.contractsState());

      // always run contractCode so other functionality like 'afterDeploy' can also work
      let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
      let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
      RunCode.doEval(contractCode, {web3: self.web3});

      if (contract.onDeploy !== undefined) {
        self.logger.info(__('executing onDeploy commands'));

        let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
        RunCode.doEval(contractCode, {web3: self.web3});

        let withErrors = false;
        let regex = /\$\w+/g;
        let onDeployCode = contract.onDeploy.map((cmd) => {
          let realCmd = cmd.replace(regex, (match) => {
            let referedContractName = match.slice(1);
            let referedContract = self.contractsManager.getContract(referedContractName);
            if (!referedContract) {
              self.logger.error(__('error executing onDeploy for ') + contract.className.cyan);
              self.logger.error(referedContractName + __(' does not exist'));
              self.logger.error(__("error running onDeploy: ") + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && referedContract.deploy === false) {
              self.logger.error(__('error executing onDeploy for ') + contract.className.cyan);
              self.logger.error(referedContractName + __(" exists but has been set to not deploy"));
              self.logger.error(__("error running onDeploy: ") + cmd);
              withErrors = true;
              return;
            }
            if (referedContract && !referedContract.deployedAddress) {
              self.logger.error(__('error executing onDeploy for ') + contract.className.cyan);
              self.logger.error(__("couldn't find a valid address for %s has it been deployed?", referedContractName));
              self.logger.error(__("error running onDeploy: ") + cmd);
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
          self.logger.info(__("executing: ") + cmd);
          try {
            RunCode.doEval(cmd, {web3: self.web3});
          } catch(e) {
            if (e.message.indexOf("invalid opcode") >= 0) {
              self.logger.error(__('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation'));
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
    let accounts = [];
    let contractParams = (params || contract.args).slice();
    let contractCode = contract.code;
    let deploymentAccount = self.blockchain.defaultAccount();
    let deployObject;

    async.waterfall([
      function getAccounts(next) {
        self.blockchain.getAccounts(function (err, _accounts) {
          if (err) {
            return next(new Error(err));
          }
          accounts = _accounts;

          // applying deployer account configuration, if any
          if (typeof contract.fromIndex == 'number') {
            deploymentAccount = accounts[contract.fromIndex];
            if (deploymentAccount === undefined) {
              return next(__("error deploying") + " " + contract.className + ": " + __("no account found at index") + " " + contract.fromIndex + __(" check the config"));
            }
          }
          if (typeof contract.from == 'string' && typeof contract.fromIndex != 'undefined') {
            self.logger.warn(__('Both "from" and "fromIndex" are defined for contract') + ' "' + contract.className + '". ' + __('Using "from" as deployer account.'));
          }
          if (typeof contract.from == 'string') {
            deploymentAccount = contract.from;
          }

          deploymentAccount = deploymentAccount || accounts[0];
          next();
        });
      },
      function doLinking(next) {
        // Applying linked contracts
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
            return next(new Error(__("{{linkReference}} is too long, try reducing the path of the contract ({{filename}}) and/or its name {{contractName}}", {linkReference: linkReference, filename: filename, contractName: contractObj.className})));
          }
          let toReplace = linkReference + "_".repeat(40 - linkReference.length);
          if (deployedAddress === undefined) {
            let libraryName = contractObj.className;
            return next(new Error(__("{{contractName}} needs {{libraryName}} but an address was not found, did you deploy it or configured an address?", {contractName: contract.className, libraryName: libraryName})));
          }
          contractCode = contractCode.replace(new RegExp(toReplace, "g"), deployedAddress);
        }
        // saving code changes back to contract object
        contract.code = contractCode;
        next();
      },
      function applyBeforeDeploy(next) {
        let beforeDeployPlugins = self.plugins.getPluginsFor('beforeDeploy');

        //self.logger.info("applying beforeDeploy plugins...", beforeDeployPlugins.length);
        async.eachSeries(beforeDeployPlugins, (plugin, eachPluginCb) => {
          self.logger.info(__("running beforeDeploy plugin %s .", plugin.name));

          // calling each beforeDeploy handler declared by the plugin
          async.eachSeries(plugin.beforeDeploy, (beforeDeployFn, eachCb) => {
            function beforeDeployCb(resObj){
              contract.code = resObj.contractCode;
              eachCb();
            }
            beforeDeployFn({
              embarkDeploy:       self,
              pluginConfig:       plugin.pluginConfig,
              deploymentAccount:  deploymentAccount,
              contract:           contract,
              callback: beforeDeployCb
            }, beforeDeployCb);
          }, () => {
            //self.logger.info('All beforeDeploy handlers of the plugin has processed.');
            eachPluginCb();
          });
        }, () => {
          //self.logger.info('All beforeDeploy plugins has been processed.');
          contractCode = contract.code;
          next();
        });
      },
      function createDeployObject(next) {
        let contractObject = self.blockchain.ContractObject({abi: contract.abiDefinition});

        try {
          const dataCode = contractCode.startsWith('0x') ? contractCode : "0x" + contractCode;
          deployObject = self.blockchain.deployContractObject(contractObject, {arguments: contractParams, data: dataCode});
        } catch(e) {
          if (e.message.indexOf('Invalid number of parameters for "undefined"') >= 0) {
            return next(new Error(__("attempted to deploy %s without specifying parameters", contract.className)));
          } else {
            return next(new Error(e));
          }
        }
        next();
      },
      function estimateCorrectGas(next) {
        if (contract.gas === 'auto') {
          return deployObject.estimateGas().then((gasValue) => {
            contract.gas = gasValue;
            next();
          }).catch(next);
        }
        next();
      },
      function deployTheContract(next) {
        self.logger.info(__("deploying") + " " + contract.className.bold.cyan + " " + __("with").green + " " + contract.gas + " " + __("gas").green);

        self.blockchain.deployContractFromObject(deployObject, {
          from: deploymentAccount,
          gas: contract.gas,
          gasPrice: contract.gasPrice
        }, function(error, receipt) {
          if (error) {
            self.events.emit('contractsState', self.contractsManager.contractsState());
            return next(new Error("error deploying =" + contract.className + "= due to error: " + error.message));
          }
          self.logger.info(contract.className.bold.cyan + " " + __("deployed at").green + " " + receipt.contractAddress.bold.cyan);
          contract.deployedAddress = receipt.contractAddress;
          contract.transactionHash = receipt.transactionHash;
          self.events.emit('contractsState', self.contractsManager.contractsState());
          return next(null, receipt.contractAddress);
        });
      }
    ], callback);
  }

  deployAll(done) {
    let self = this;
    this.logger.info(__("deploying contracts"));
    let contracts = this.contractsManager.listContracts();
    this.events.emit("deploy:beforeAll");

    async.eachOfSeries(contracts,
      function (contract, key, callback) {
        self.logger.trace(arguments);
        self.checkAndDeployContract(contract, null, callback);
      },
      function (err, _results) {
        if (err) {
          self.logger.error(__("error deploying contracts"));
          self.logger.error(err.message);
          self.logger.debug(err.stack);
        }
        if (contracts.length === 0) {
          self.logger.info(__("no contracts found"));
          return done();
        }
        self.logger.info(__("finished deploying contracts"));
        self.logger.trace(arguments);
        done(err);
      }
    );

  }
}

module.exports = Deploy;
