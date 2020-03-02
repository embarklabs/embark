import {__} from 'embark-i18n';
import Web3 from 'web3';
import Contract from './contract';
const async = require('async');
const constants = require('embark-core/constants');
const {dappPath, proposeAlternative, toposort} = require('embark-utils');

export default class ContractsManager {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.plugins = options.plugins;
    this.currentContext = embark.currentContext || [];
    this.contracts = {};
    this.contractDependencies = {};
    this.deployOnlyOnConfig = false;
    this.compileError = null;
    this.compileOnceOnly = options.compileOnceOnly;
    this._web3 = null;

    this.events.setCommandHandler("contracts:reset", (cb) => {
      this.contracts = {};
      cb(null);
    });

    this.events.setCommandHandler("contracts:build", this.buildContracts.bind(this));

    this.events.setCommandHandler('contracts:list', (cb) => {
      cb(this.compileError, this.listContracts());
    });

    this.events.setCommandHandler('contracts:state', (cb) => {
      cb(this.compileError, this.contractsState());
    });

    this.events.setCommandHandler("contracts:contract", (contractName, cb) => {
      cb(null, this.getContract(contractName));
    });

    this.events.setCommandHandler('contracts:add', (contract, cb = () => {}) => {
      this.contracts[contract.className] = new Contract(this.logger, contract);
      cb(null, this.contracts[contract.className]);
    });

    this.events.on("blockchain:started", () => {
      this._web3 = null;
    });

    this.registerCommands();
    this.registerAPIs();
  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  set web3(val) {
    this._web3 = val;
  }

  registerCommands() {
    const self = this;

    self.events.setCommandHandler('contracts:all', (cb) => {
      cb(self.compileError, self.contracts);
    });

    self.events.setCommandHandler('contracts:dependencies', (cb) => {
      cb(self.compileError, self.contractDependencies);
    });

    self.events.setCommandHandler("contracts:contract:byTxHash", (txHash, cb) => {
      self.getContractByTxHash(txHash, cb);
    });

    self.events.setCommandHandler("contracts:reset:dependencies", (cb) => {
      self.contractDependencies = {};
      cb();
    });

    this.events.setCommandHandler('setDashboardState', () => {
      self.events.emit('contracts:state', self.contractsState());
    });
  }

  registerAPIs() {
    let embark = this.embark;
    const self = this;

    embark.registerAPICall(
      'get',
      '/embark-api/contract/:contractName',
      (req, res) => {
        try {
          const contract = self.getContract(req.params.contractName);
          if (!contract) {
            res.status(404).send({error: `Contract '${req.params.contractName}' not found.`});
          }
          res.status(200).send(contract);
        } catch (err) {
          res.status(500).send({error: `Error getting contract: ${err.message || err}`});
        }
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/:contractName/function',
      async (req, res) => {
        let funcCall;
        try {
          const contract = this.getContract(req.body.contractName);
          const web3 = await this.web3;
          const accounts = await web3.eth.getAccounts();
          const contractObj = new web3.eth.Contract(contract.abiDefinition, contract.deployedAddress);
          const abi = contract.abiDefinition.find(definition => definition.name === req.body.method);
          funcCall = (abi.constant === true || abi.stateMutability === 'view' || abi.stateMutability === 'pure') ? 'call' : 'send';
          let value = typeof req.body.value === "number" ? req.body.value.toString() : req.body.value;
          const gas = await contractObj.methods[req.body.method].apply(this, req.body.inputs).estimateGas({value});

          contractObj.methods[req.body.method].apply(this, req.body.inputs)[funcCall]({
            from: web3.eth.defaultAccount || accounts[0],
            gasPrice: req.body.gasPrice,
            gas: Math.floor(gas),
            value
          }, (error, result) => {
            const paramString = abi.inputs.map((input, idx) => {
              const quote = input.type.indexOf("int") === -1 ? '"' : '';
              return quote + req.body.inputs[idx] + quote;
            }).join(', ');

            let contractLog = {
              name: req.body.contractName,
              functionName: req.body.method,
              paramString: paramString,
              address: contract.deployedAddress,
              status: '0x0'
            };

            if (error) {
              self.events.emit('contracts:log', contractLog);
              return res.status(200).send({result: error.message});
            }

            if (funcCall === 'call') {
              contractLog.status = '0x1';
              return res.status(200).send({result});
            }

            res.send({result});
          });
        } catch (err) {
          if (funcCall === 'call' && err.message === constants.blockchain.gasAllowanceError) {
            return res.status(200).send({result: constants.blockchain.gasAllowanceErrorMessage});
          }
          res.status(200).send({result: err.message || err});
        }
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/:contractName/deploy',
      async (req, res) => {
        try {
          const contract = this.getContract(req.body.contractName);
          const web3 = await this.web3;
          const accounts = await web3.eth.getAccounts();
          const contractObj = new web3.eth.Contract(contract.abiDefinition, contract.deployedAddress);
          try {
            const params = {data: `0x${contract.code}`, arguments: req.body.inputs};
            let gas = await contractObj.deploy(params).estimateGas();
            let newContract = await contractObj.deploy(params).send({from: web3.eth.defaultAccount || accounts[0], gas, gasPrice: req.body.gasPrice});
            res.status(200).send({result: newContract._address});
          } catch (e) {
            res.status(200).send({result: e.message});
          }
        } catch (err) {
          res.status(500).send({error: `Error deploying contract: ${err.message || err}`});
        }
      }
    );

    embark.registerAPICall(
      'get',
      '/embark-api/contracts',
      (_req, res) => {
        res.status(200).send(this._contractsForApi());
      }
    );

    embark.registerAPICall(
      'ws',
      '/embark-api/contracts',
      (ws, _res) => {
        this.events.on('contractsDeployed', () => {
          ws.send(JSON.stringify(this._contractsForApi()), () => undefined);
        });
        this.events.on('contracts:state', () => {
          ws.send(JSON.stringify(this._contractsForApi()), () => undefined);
        });
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/deploy',
      (req, res) => {
        this.logger.trace(`POST request /embark-api/contract/deploy:\n ${JSON.stringify(req.body)}`);
        if (typeof req.body.compiledContract !== 'object') {
          return res.send({error: 'Body parameter \'compiledContract\' must be an object'});
        }
        self.compiledContracts = Object.assign(self.compiledContracts, req.body.compiledContract);
        const contractNames = Object.keys(req.body.compiledContract);
        self.build((err, _mgr) => {
          if (err) {
            return res.send({error: err.message});
          }

          // for each compiled contract, deploy (in parallel)
          async.each(contractNames, (contractName, next) => {
            const contract = self.contracts[contractName];
            contract.args = []; /* TODO: override contract.args */
            contract.className = contractName;
            self.events.request("deploy:contract", contract, (err) => {
              next(err);
            });
          }, (err) => {
            let responseData = {};
            if (err) {
              responseData.error = err.message;
            }
            else responseData.result = contractNames;
            this.logger.trace(`POST response /embark-api/contract/deploy:\n ${JSON.stringify(responseData)}`);
            res.send(responseData);
          });
        }, false, false);
      }
    );
  }

  formatContracts() {
    return this.listContracts().map((contract, index) => (
      {
        className: contract.className,
        deploy: contract.deploy,
        error: contract.error,
        address: contract.deployedAddress,
        args: contract.args,
        transactionHash: contract.transactionHash,
        gas: contract.gas,
        gasPrice: contract.gasPrice,
        index
      }
    ));
  }

  buildContracts(contractsConfig, compiledContracts, done) {
    const self = this;

    async.waterfall([
      function beforeBuild(callback) {
        self.plugins.emitAndRunActionsForEvent('contracts:build:before', callback);
      },
      function prepareContractsFromConfig(_options, callback) {
        self.events.emit("status", __("Building..."));

        if (contractsConfig.contracts.deploy) {
          contractsConfig.contracts = contractsConfig.contracts.deploy;
        }
        async.eachOf(contractsConfig.contracts, (contract, className, eachCb) => {
          contract = new Contract(self.logger, contract);
          if (!contract.artifact) {
            contract.className = className;
            contract.args = contract.args || [];

            self.contracts[className] = contract;
            return eachCb();
          }

          self.fs.readFile(dappPath(contract.artifact), (err, artifactBuf) => {
            if (err) {
              self.logger.error(__('Error while reading the artifact for "{{className}}" at {{path}}', {className, path: contract.artifact}));
              return eachCb(err);
            }
            try {
              const contract = JSON.parse(artifactBuf.toString());
              self.contracts[className] = new Contract(self.logger, contract);
              if (self.contracts[className].deployedAddress) {
                self.contracts[className].address = self.contracts[className].deployedAddress;
              }
              eachCb();
            } catch (e) {
              self.logger.error(__('Artifact file does not seem to be valid JSON (%s)', contract.artifact));
              eachCb(e.message);
            }
          });
        }, callback);
      },
      function prepareContractsForCompilation(callback) {
        let gasPrice = contractsConfig.gasPrice;

        for (const className in compiledContracts) {
          const compiledContract = compiledContracts[className];
          const contractConfig = contractsConfig.contracts[className];

          let contract = self.contracts[className];
          if (!contract) {
            contract = new Contract(self.logger, contractConfig);
            contract.className = className;
            contract.args = [];
            if (contractsConfig.strategy === constants.deploymentStrategy.explicit) {
              contract.deploy = false;
            }
          }

          contract.code = compiledContract.code;
          contract.runtimeBytecode = compiledContract.runtimeBytecode;
          contract.realRuntimeBytecode = (compiledContract.realRuntimeBytecode || compiledContract.runtimeBytecode);
          contract.linkReferences = compiledContract.linkReferences;
          contract.swarmHash = compiledContract.swarmHash;
          contract.gasEstimates = compiledContract.gasEstimates;
          contract.functionHashes = compiledContract.functionHashes;
          contract.abiDefinition = contractConfig?.abiDefinition ?? compiledContract.abiDefinition;
          contract.filename = compiledContract.filename;
          contract.originalFilename = compiledContract.originalFilename || ("contracts/" + contract.filename);
          contract.path = dappPath(contract.originalFilename);
          contract.gas = (contractConfig && contractConfig.gas) || contractsConfig.gas || 'auto';
          contract.gasPrice = contract.gasPrice || gasPrice;
          contract.type = 'file';
          contract.className = className;

          if (contract.address && typeof contract.address === 'function') {
            contract.addressHandler = contract.address;
            delete contract.address;
          } else if (contract.address && typeof contract.address === 'string') {
            contract.deployedAddress = contract.address;
          }

          self.contracts[className] = contract;
        }
        callback();
      },
      function setDeployIntention(callback) {
        let className, contract;
        let showInterfaceMessageTrace = false;
        let showInterfaceMessageWarn = false;
        const isTest = self.currentContext.includes(constants.contexts.test);
        const contractsInConfig = Object.keys(contractsConfig.contracts);

        for (className in self.contracts) {
          contract = self.contracts[className];
          if (self.deployOnlyOnConfig && !contractsConfig.contracts[className]) {
            contract.deploy = false;
          }

          if (contract.deploy !== true && !contractsConfig.contracts[className] && contractsConfig.strategy === constants.deploymentStrategy.explicit) {
            contract.deploy = false;
          }

          contract.deploy = contract.deploy ?? true;

          if (contract.code === "") {
            const message = __("assuming %s to be an interface", className);
            if (contract.silent || (isTest && !contractsInConfig.includes(className))) {
              showInterfaceMessageTrace = true;
              self.logger.trace(message);
            } else {
              showInterfaceMessageWarn = true;
              self.logger.warn(message);
            }
            contract.deploy = false;
          }
        }
        if (showInterfaceMessageTrace || showInterfaceMessageWarn) {
          let logFunction = showInterfaceMessageWarn ? self.logger.warn : self.logger.trace;
          logFunction.call(self.logger, __('To get more details on interface Smart contracts, go here: %s', 'https://framework.embarklabs.io/docs/troubleshooting.html#Assuming-Contract-to-be-an-interface'.underline));

        }
        callback();
      },
      // eslint-disable-next-line complexity
      function dealWithSpecialConfigs(callback) {
        let className, contract, parentContractName, parentContract;
        let dictionary = Object.keys(self.contracts);

        for (className in self.contracts) {
          contract = self.contracts[className];

          if (!contract.instanceOf && !contract.proxyFor) {
            continue;
          }

          if (contract.instanceOf) {
            parentContractName = contract.instanceOf;
            parentContract = self.contracts[parentContractName];
            if (!self._isParentContractDependencyCorrect(className, parentContract, 'instanceOf', dictionary)) {
              continue;
            }

            // If the contract has no args and the parent has them, use the parent's args in its place
            if (parentContract.args?.length > 0 && contract.args?.length === 0) {
              contract.args = parentContract.args;
            }

            if (!contract.code) {
              self.logger.error(__("{{className}} has code associated to it but it's configured as an instanceOf {{parentContractName}}", {
                className,
                parentContractName
              }));
            }

            contract.path = parentContract.path;
            contract.originalFilename = parentContract.originalFilename;
            contract.filename = parentContract.filename;
            contract.code = parentContract.code;
            contract.runtimeBytecode = parentContract.runtimeBytecode;
            contract.realRuntimeBytecode = (parentContract.realRuntimeBytecode || parentContract.runtimeBytecode);
            contract.gasEstimates = parentContract.gasEstimates;
            contract.functionHashes = parentContract.functionHashes;
            contract.abiDefinition = parentContract.abiDefinition;
            contract.linkReferences = parentContract.linkReferences;

            contract.gas = contract.gas || parentContract.gas;
            contract.gasPrice = contract.gasPrice || parentContract.gasPrice;
            contract.type = 'instance';
          }

          if (contract.proxyFor) {
            parentContractName = contract.proxyFor;
            parentContract = self.contracts[parentContractName];
            if (!self._isParentContractDependencyCorrect(className, parentContract, 'proxyFor', dictionary)) {
              continue;
            }

            // Merge ABI of contract and proxy so that the contract shares both ABIs, but remove the constructor
            contract.abiDefinition = contract.abiDefinition.concat(parentContract.abiDefinition.filter(def => def.type !== 'constructor'));
          }
        }
        callback();
      },
      function removeContractsWithNoCode(callback) {
        let className, contract;
        let dictionary = Object.keys(self.contracts);
        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.code === undefined && !contract.abiDefinition) {
            self.logger.error(__("%s has no code associated", className));
            let suggestion = proposeAlternative(className, dictionary, [className]);
            if (suggestion) {
              self.logger.warn(__('did you mean "%s"?', suggestion));
            }
            delete self.contracts[className];
          }
        }
        self.logger.trace(self.contracts);
        callback();
      },
      // TODO: needs refactoring, has gotten too complex
      /*eslint complexity: ["error", 19]*/
      /*eslint max-depth: ["error", 19]*/
      function determineDependencies(callback) {
        for (const className in self.contracts) {
          const contract = self.contracts[className];

          self.contractDependencies[className] = self.contractDependencies[className] || [];

          if (Array.isArray(contract.deps)) {
            self.contractDependencies[className] = self.contractDependencies[className].concat(contract.deps);
          }

          // look in linkReferences for dependencies
          if (contract.linkReferences) {
            Object.values(contract.linkReferences).forEach(fileReference => {
              Object.keys(fileReference).forEach(libName => {
                self.contractDependencies[className].push(libName);
              });
            });
          }

          let ref;
          if (Array.isArray(contract.args)) {
            ref = contract.args;
          } else {
            ref = Object.values(contract.args);
          }

          for (let j = 0; j < ref.length; j++) {
            let arg = ref[j];
            if (arg[0] === "$" && !arg.startsWith('$accounts')) {
              self.contractDependencies[className].push(arg.substr(1));
              self.checkDependency(className, arg.substr(1));
            }
            if (Array.isArray(arg)) {
              for (let sub_arg of arg) {
                if (sub_arg[0] === "$" && !sub_arg.startsWith('$accounts')) {
                  self.contractDependencies[className].push(sub_arg.substr(1));
                  self.checkDependency(className, sub_arg.substr(1));
                }
              }
            }
          }

          // look in onDeploy for dependencies
          if (Array.isArray(contract.onDeploy)) {
            let regex = /\$\w+/g;
            contract.onDeploy.map((cmd) => {
              if (cmd.indexOf('$accounts') > -1) {
                return;
              }
              cmd.replace(regex, (match) => {
                if (match.substring(1) === contract.className) {
                  // Contract self-referencing. In onDeploy, it should be available
                  return;
                }
                self.contractDependencies[className].push(match.substr(1));
              });
            });
          }

          // Remove duplicates
          if (self.contractDependencies[className]) {
            const o = {};
            self.contractDependencies[className].forEach(function (e) {
              o[e] = true;
            });
            self.contractDependencies[className] = Object.keys(o);
          }
        }
        callback();
      }
    ], function (err) {
      if (err) {
        self.compileError = err;
        self.events.emit("status", __("Build error"));
        self.events.emit("outputError", __("Error building Dapp, please check console"));
        self.logger.error(__("Error Building contracts"));
      } else {
        self.compileError = null;
      }
      self.logger.trace("finished".underline);

      done(err, self.contracts, self.contractDependencies);
    });
  }

  _isParentContractDependencyCorrect(className, parentContract, typeOfInheritance, dictionary) {
    const parentContractName = parentContract.className;
    if (parentContract === className) {
      this.logger.error(__("{{className}} : {{typeOfInheritance}} is set to itself", {className, typeOfInheritance}));
      return false;
    }

    if (parentContract === undefined) {
      this.logger.error(__("{{className}}: couldn't find {{typeOfInheritance}} contract {{parentContractName}}", {
        className,
        parentContractName,
        typeOfInheritance
      }));
      let suggestion = proposeAlternative(parentContractName, dictionary, [className, parentContractName]);
      if (suggestion) {
        this.logger.warn(__('did you mean "%s"?', suggestion));
      }
      return false;
    }
    return true;
  }

  _contractsForApi() {
    const contracts = this.formatContracts();
    contracts.forEach((contract) => {
      Object.assign(contract, this.getContract(contract.className));
    });
    return contracts;
  }

  checkDependency(className, dependencyName) {
    if (!this.contractDependencies[className]) {
      return;
    }
    if (!this.contracts[dependencyName]) {
      this.logger.warn(__('{{className}} has a dependency on {{dependencyName}}', {className, dependencyName}) +
        __(', but it is not present in the contracts'));
      return;
    }
    if (!this.contracts[dependencyName].deploy) {
      this.logger.warn(__('{{className}} has a dependency on {{dependencyName}}', {className, dependencyName}) +
        __(', but it is not set to deploy. It could be an interface.'));
    }
  }

  getContract(className) {
    return this.contracts[className];
  }

  getContractByTxHash(txHash, cb) {
    this.events.request("blockchain:getTransaction", txHash, (err, tx) => {
      if (err) return cb(err.message);
      if (!tx) return cb("tx hash not found");

      for (let contractName in this.contracts) {
        let contract = this.contracts[contractName];
        if (tx.to === contract.deployedAddress) {
          return cb(null, contract);
        }
      }
      cb("no known contract found for txHash: " + txHash);
    });
  }

  sortContracts(contractList) {
    let converted_dependencies = [], i;

    for (let contract in this.contractDependencies) {
      let dependencies = this.contractDependencies[contract];
      for (i = 0; i < dependencies.length; i++) {
        converted_dependencies.push([contract, dependencies[i]]);
      }
    }

    let orderedDependencies;

    try {
      orderedDependencies = toposort(converted_dependencies.filter((x) => x[0] !== x[1])).reverse();
    } catch (e) {
      this.logger.error((__("Error: ") + e.message).red);
      this.logger.error(__("there are two or more contracts that depend on each other in a cyclic manner").bold.red);
      this.logger.error(__("Embark couldn't determine which one to deploy first").red);
      throw new Error("CyclicDependencyError");
    }

    return contractList.sort(function (a, b) {
      let order_a = orderedDependencies.indexOf(a.className);
      let order_b = orderedDependencies.indexOf(b.className);
      return order_a - order_b;
    });
  }

  // TODO: should be built contracts
  listContracts() {
    let contracts = [];
    for (let className in this.contracts) {
      let contract = this.contracts[className];
      contracts.push(contract);
    }
    return this.sortContracts(contracts);
  }

  contractsState() {
    let data = [];

    for (let className in this.contracts) {
      let contract = this.contracts[className];
      if (contract.silent) {
        continue;
      }

      let contractData;

      if (contract.deploy === false) {
        contractData = [
          className.green,
          __('Interface or set to not deploy').green,
          "\t\tn/a".green
        ];
      } else if (contract.error) {
        contractData = [
          className.green,
          (contract.error).split("\n")[0].replace(/Error: /g, '').substring(0, 32).red,
          '\t\tError'.red
        ];
      } else {
        contractData = [
          className.green,
          (contract.deployedAddress || '...').green,
          ((contract.deployedAddress !== undefined) ? ("\t\t" + __("Deployed")).green : ("\t\t" + __("Pending")).magenta)
        ];
      }

      data.push(contractData);
    }

    return data;
  }
}
