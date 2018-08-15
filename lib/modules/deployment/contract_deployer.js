let async = require('async');
//require("../utils/debug_util.js")(__filename, async);
let utils = require('../../utils/utils.js');

class ContractDeployer {
  constructor(options) {
    const self = this;

    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;

    self.events.setCommandHandler('deploy:contract', (contract, cb) => {
      self.checkAndDeployContract(contract, null, cb);
    });
  }

  // TODO: determining the arguments could also be in a module since it's not
  // part of ta 'normal' contract deployment
  determineArguments(suppliedArgs, contract, accounts, callback) {
    const self = this;

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

    function parseArg(arg, cb) {
      const match = arg.match(/\$accounts\[([0-9]+)]/);
      if (match) {
        if (!accounts[match[1]]) {
          return cb(__('No corresponding account at index $d', match[1]));
        }
        return cb(null, accounts[match[1]]);
      }
      let contractName = arg.substr(1);
      self.events.request('contracts:contract', contractName, (referedContract) => {
        cb(null, referedContract.deployedAddress);
      });
    }

    async.map(args, (arg, nextEachCb) => {
      if (arg[0] === "$") {
        parseArg(arg, nextEachCb);
      } else if (Array.isArray(arg)) {
        async.map(arg, (sub_arg, nextSubEachCb) => {
          if (sub_arg[0] === "$") {
            parseArg(sub_arg, nextSubEachCb);
          } else {
            nextSubEachCb(null, sub_arg);
          }
        }, (err, subRealArgs) => {
          nextEachCb(null, subRealArgs);
        });
      } else {
        nextEachCb(null, arg);
      }
    }, callback);
  }

  checkAndDeployContract(contract, params, callback) {
    let self = this;
    contract.error = false;
    let accounts = [];
    let deploymentAccount;

    if (contract.deploy === false) {
      self.events.emit("deploy:contract:undeployed", contract);
      return callback();
    }

    async.waterfall([
      function requestBlockchainConnector(callback) {
        self.events.request("blockchain:object", (blockchain) => {
          self.blockchain = blockchain;
          callback();
        });
      },

      // TODO: can potentially go to a beforeDeploy plugin
      function getAccounts(next) {
        deploymentAccount = self.blockchain.defaultAccount();
        self.blockchain.getAccounts(function (err, _accounts) {
          if (err) {
            return next(new Error(err));
          }
          accounts = _accounts;

          // applying deployer account configuration, if any
          if (typeof contract.fromIndex === 'number') {
            deploymentAccount = accounts[contract.fromIndex];
            if (deploymentAccount === undefined) {
              return next(__("error deploying") + " " + contract.className + ": " + __("no account found at index") + " " + contract.fromIndex + __(" check the config"));
            }
          }
          if (typeof contract.from === 'string' && typeof contract.fromIndex !== 'undefined') {
            self.logger.warn(__('Both "from" and "fromIndex" are defined for contract') + ' "' + contract.className + '". ' + __('Using "from" as deployer account.'));
          }
          if (typeof contract.from === 'string') {
            deploymentAccount = contract.from;
          }

          deploymentAccount = deploymentAccount || accounts[0];
          contract.deploymentAccount = deploymentAccount;
          next();
        });
      },
      function _determineArguments(next) {
        self.determineArguments(params || contract.args, contract, accounts, (err, realArgs) => {
          if (err) {
            return next(err);
          }
          contract.realArgs = realArgs;
          next();
        });
      },
      function deployIt(next) {
        if (contract.address !== undefined) {
          try {
            utils.toChecksumAddress(contract.address);
          } catch(e) {
            self.logger.error(__("error deploying %s", contract.className));
            self.logger.error(e.message);
            contract.error = e.message;
            self.events.emit("deploy:contract:error", contract);
            return next(e.message);
          }
          contract.deployedAddress = contract.address;
          self.logger.info(contract.className.bold.cyan + __(" already deployed at ").green + contract.address.bold.cyan);
          self.events.emit("deploy:contract:deployed", contract);
          return next();
        }

        // TODO find a better way to do that
        if (process.env.isTest) {
          return self.deployContract(contract, next);
        }
        // TODO: this should be a plugin API instead, if not existing, it should by default deploy the contract
        self.events.request("deploy:contract:shouldDeploy", contract, function(trackedContract) {
          if (!trackedContract) {
            return self.deployContract(contract, next);
          }

          self.blockchain.getCode(trackedContract.address, function(_getCodeErr, codeInChain) {
            if (codeInChain !== "0x") {
              self.contractAlreadyDeployed(contract, trackedContract, next);
            } else {
              self.deployContract(contract, next);
            }
          });
        });
      }
    ], callback);
  }

  contractAlreadyDeployed(contract, trackedContract, callback) {
    const self = this;
    self.logger.info(contract.className.bold.cyan + __(" already deployed at ").green + trackedContract.address.bold.cyan);
    contract.deployedAddress = trackedContract.address;
    self.events.emit("deploy:contract:deployed", contract);

    // TODO: can be moved into a afterDeploy event
    // just need to figure out the gasLimit coupling issue
    self.events.request('code-generator:contract:vanilla', contract, contract._gasLimit, (contractCode) => {
      self.events.request('runcode:eval', contractCode, () => {}, true);
      return callback();
    });
  }

  deployContract(contract, callback) {
    let self = this;
    let contractParams = (contract.realArgs || contract.args).slice();
    let deployObject;
    const logFunction = contract.silent ? self.logger.trace.bind(self.logger) : self.logger.info.bind(self.logger);

    async.waterfall([
      function doLinking(next) {
        let contractCode = contract.code;
        self.events.request('contracts:list', (_err, contracts) => {
          for (let contractObj of contracts) {
            let filename = contractObj.filename;
            let deployedAddress = contractObj.deployedAddress;
            if (deployedAddress) {
              deployedAddress = deployedAddress.substr(2);
            }
            let linkReference = '__' + filename + ":" + contractObj.className;
            if (contractCode.indexOf(linkReference.substr(0, 38)) < 0) { // substr to simulate the cut that solc does
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
          // saving code changes back to the contract object
          contract.code = contractCode;
          self.events.request('contracts:setBytecode', contract.className, contractCode);
          next();
        });
      },
      function applyBeforeDeploy(next) {
        self.plugins.emitAndRunActionsForEvent('deploy:contract:beforeDeploy', {contract: contract}, next);
      },
      function getGasPriceForNetwork(next) {
        self.events.request("blockchain:gasPrice", (gasPrice) => {
          contract.gasPrice = contract.gasPrice || gasPrice;
          next();
        });
      },
      function createDeployObject(next) {
        let contractCode   = contract.code;
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
          return self.blockchain.estimateDeployContractGas(deployObject, (err, gasValue) => {
            if (err) {
              return next(err);
            }
            contract.gas = gasValue;
            next();
          });
        }
        next();
      },
      function deployTheContract(next) {
        let estimatedCost = contract.gas * contract.gasPrice;
        logFunction(__("deploying") + " " + contract.className.bold.cyan + " " + __("with").green + " " + contract.gas + " " + __("gas at the price of").green + " " + contract.gasPrice + " " + __("Wei, estimated cost:").green + " " + estimatedCost + " Wei".green);


        self.blockchain.deployContractFromObject(deployObject, {
          from: contract.deploymentAccount,
          gas: contract.gas,
          gasPrice: contract.gasPrice
        }, function(error, receipt) {
          if (error) {
            contract.error = error.message;
            self.events.emit("deploy:contract:error", contract);
            return next(new Error("error deploying =" + contract.className + "= due to error: " + error.message));
          }
          logFunction(contract.className.bold.cyan + " " + __("deployed at").green + " " + receipt.contractAddress.bold.cyan + " " + __("using").green + " " + receipt.gasUsed + " " + __("gas").green);
          contract.deployedAddress = receipt.contractAddress;
          contract.transactionHash = receipt.transactionHash;
          receipt.className = contract.className;
          self.events.emit("deploy:contract:receipt", receipt);
          self.events.emit("deploy:contract:deployed", contract);

          // TODO: can be moved into a afterDeploy event
          // just need to figure out the gasLimit coupling issue
          self.events.request('code-generator:contract:vanilla', contract, contract._gasLimit, (contractCode) => {
            self.events.request('runcode:eval', contractCode, () => {}, true);
            self.plugins.runActionsForEvent('deploy:contract:deployed', {contract: contract}, () => {
              return next(null, receipt);
            });
          });
        });
      }
    ], callback);
  }

}

module.exports = ContractDeployer;
