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
    this.events = options.events;
    this.env = options.env;
    this.chainConfig = options.chainConfig;
    this.plugins = options.plugins;
    this.gasLimit = options.gasLimit;

    const self = this;
    this.events.setCommandHandler('setDashboardState', () => {
      self.events.emit('contractsState', self.contractsManager.contractsState());
    });

    self.events.setCommandHandler("contracts:contract", (contractName, cb) => {
      cb(self.contractsManager.getContract(contractName));
    });

    self.events.setCommandHandler("contracts:all", (contractName, cb) => {
      let contracts = self.contractsManager.listContracts();
      let results = {};
      for (let className in contracts) {
        let contract = contracts[className];
        
        results[className] = {
          name: contract.className,
          deploy: contract.deploy,
          error: contract.error,
          address: contract.deployedAddress
        };
      }
      cb(results);
    });

    let plugin = this.plugins.createPlugin('deployment', {});
    plugin.registerAPICall(
      'get',
      '/embark/contract/:contractName',
      (req, res) => {
        self.events.request('contracts:contract', req.params.contractName, res.send.bind(res));
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark/contracts',
      (req, res) => {
        self.events.request('contracts:all', null, res.send.bind(res));
      }
    );
  }

  initTracker(cb) {
    this.deployTracker = new DeployTracker({
      logger: this.logger, chainConfig: this.chainConfig, web3: this.web3, env: this.env
    }, cb);
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
          this.logger.error(input.name + " has not been defined for " + contract.className + " constructor");
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
    let realArgs;
    contract.error = false;

    if (contract.deploy === false) {
      self.events.emit('contractsState', self.contractsManager.contractsState());
      return callback();
    }

    realArgs = self.determineArguments(params || contract.args, contract);

    if (contract.address !== undefined) {
      try {
        this.web3.utils.toChecksumAddress(contract.address);
      } catch(e) {
        self.logger.error("error deploying " + contract.className);
        self.logger.error(e.message);
        contract.error = e.message;
        self.events.emit('contractsState', self.contractsManager.contractsState());
        return callback(e.message);
      }
      contract.deployedAddress = contract.address;
      self.logger.info(contract.className.bold.cyan + " already deployed at ".green + contract.address.bold.cyan);
      if (this.deployTracker) {
        self.deployTracker.trackContract(contract.className, contract.realRuntimeBytecode, realArgs, contract.address);
        self.deployTracker.save();
      }
      self.events.emit('contractsState', self.contractsManager.contractsState());
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
    self.events.emit('contractsState', self.contractsManager.contractsState());

    // always run contractCode so other functionality like 'afterDeploy' can also work
    let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
    let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
    RunCode.doEval(contractCode, self.web3);

    return callback();
  }

  contractToDeploy(contract, params, callback) {
    const self = this;
    let realArgs = self.determineArguments(params || contract.args, contract);

    this.deployContract(contract, realArgs, function (err, address) {
      if (err) {
        return callback(new Error(err));
      }
      self.deployTracker.trackContract(contract.className, contract.realRuntimeBytecode, realArgs, address);
      self.deployTracker.save();
      self.events.emit('contractsState', self.contractsManager.contractsState());

      // always run contractCode so other functionality like 'afterDeploy' can also work
      let codeGenerator = new CodeGenerator({contractsManager: self.contractsManager});
      let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
      RunCode.doEval(contractCode, self.web3);

      if (contract.onDeploy !== undefined) {
        self.logger.info('executing onDeploy commands');

        let contractCode = codeGenerator.generateContractCode(contract, self.gasLimit);
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
    let accounts = [];
    let contractParams = (params || contract.args).slice();
    let contractCode = contract.code;
    let deploymentAccount = self.web3.eth.defaultAccount;
    let deployObject;

    async.waterfall([
      function getAccounts(next) {
        self.web3.eth.getAccounts(function (err, _accounts) {
          if (err) {
            return next(new Error(err));
          }
          accounts = _accounts;

          // applying deployer account configuration, if any
          if (typeof contract.fromIndex == 'number') {
            deploymentAccount = accounts[contract.fromIndex];
            if (deploymentAccount === undefined) {
              return next("error deploying " + contract.className + ": no account found at index " + contract.fromIndex + " check the config");
            }
          }
          if (typeof contract.from == 'string' && typeof contract.fromIndex != 'undefined') {
            self.logger.warn('Both "from" and "fromIndex" are defined for contract "'+contract.className+'". Using "from" as deployer account.');
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
            return next(new Error(linkReference + " is too long, try reducing the path of the contract (" + filename + ") and/or its name " + contractObj.className));
          }
          let toReplace = linkReference + "_".repeat(40 - linkReference.length);
          if (deployedAddress === undefined) {
            let libraryName = contractObj.className;
            return next(new Error(contract.className + " needs " + libraryName + " but an address was not found, did you deploy it or configured an address?"));
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
          self.logger.info("running beforeDeploy plugin " + plugin.name + " .");

          // calling each beforeDeploy handler declared by the plugin
          async.eachSeries(plugin.beforeDeploy, (beforeDeployFn, eachCb) => {
            beforeDeployFn({
              embarkDeploy:       self,
              pluginConfig:       plugin.pluginConfig,
              deploymentAccount:  deploymentAccount,
              contract:           contract,
              callback:
              (function(resObj){
                contract.code = resObj.contractCode;
                eachCb();
              })
            });
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
        let contractObject = new self.web3.eth.Contract(contract.abiDefinition);

        try {
          deployObject = contractObject.deploy({arguments: contractParams, data: "0x" + contractCode});
        } catch(e) {
          if (e.message.indexOf('Invalid number of parameters for "undefined"') >= 0) {
            return next(new Error("attempted to deploy " + contract.className + " without specifying parameters"));
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
        self.logger.info("deploying " + contract.className.bold.cyan + " with ".green + contract.gas + " gas".green);

        deployObject.send({
          from: deploymentAccount,
          gas: contract.gas,
          gasPrice: contract.gasPrice
        }).on('receipt', function(receipt) {
          if (receipt.contractAddress !== undefined) {
            self.logger.info(contract.className.bold.cyan + " deployed at ".green + receipt.contractAddress.bold.cyan);
            contract.deployedAddress = receipt.contractAddress;
            contract.transactionHash = receipt.transactionHash;
            self.events.emit('contractsState', self.contractsManager.contractsState());
            return next(null, receipt.contractAddress);
          }
          self.events.emit('contractsState', self.contractsManager.contractsState());
        }).on('error', function(error) {
          self.events.emit('contractsState', self.contractsManager.contractsState());
          return next(new Error("error deploying =" + contract.className + "= due to error: " + error.message));
        });
      }
    ], callback);
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
