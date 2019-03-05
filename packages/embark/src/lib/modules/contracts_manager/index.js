let async = require('async');
const cloneDeep = require('clone-deep');

const utils = require('../../utils/utils.js');
const constants = require('../../constants');

// TODO: create a contract object

class ContractsManager {
  constructor(embark, options) {
    const self = this;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.plugins = options.plugins;

    this.contracts = {};
    this.contractDependencies = {};
    this.deployOnlyOnConfig = false;
    this.compileError = false;
    this.compileOnceOnly = options.compileOnceOnly;

    self.events.setCommandHandler('contracts:list', (cb) => {
      cb(self.compileError, self.listContracts());
    });

    self.events.setCommandHandler('contracts:add', (contract) => {
      this.contracts[contract.className] = contract;
    });

    self.events.setCommandHandler('contracts:all', (cb) => {
      cb(self.compileError, self.contracts);
    });

    self.events.setCommandHandler('contracts:dependencies', (cb) => {
      cb(self.compileError, self.contractDependencies);
    });

    self.events.setCommandHandler("contracts:contract", (contractName, cb) => {
      cb(self.getContract(contractName));
    });

    self.events.setCommandHandler("contracts:contract:byTxHash", (txHash, cb) => {
      self.getContractByTxHash(txHash, cb);
    });

    self.events.setCommandHandler("contracts:build", (configOnly, cb) => {
      self.deployOnlyOnConfig = configOnly; // temporary, should refactor
      self.build((err) => {
        cb(err);
      });
    });

    self.events.setCommandHandler("contracts:reset:dependencies", (cb) => {
      self.contractDependencies = {};
      cb();
    });

    self.events.on("deploy:contract:error", (_contract) => {
      self.events.emit('contractsState', self.contractsState());
    });

    self.events.on("deploy:contract:deployed", (_contract) => {
      const contract = self.contracts[_contract.className];
      if (contract) {
        if (!_contract.address && _contract.deployedAddress) {
          _contract.address = _contract.deployedAddress;
        }
        if (!contract.address && _contract.address) {
          contract.address = _contract.address;
        }
        if (!contract.deployedAddress && _contract.deployedAddress) {
          contract.deployedAddress = _contract.deployedAddress;
        }
      }
      self.events.emit('contractsState', self.contractsState());
    });

    self.events.on("deploy:contract:undeployed", (_contract) => {
      self.events.emit('contractsState', self.contractsState());
    });

    this.events.setCommandHandler('setDashboardState', () => {
      self.events.emit('contractsState', self.contractsState());
    });

    self.events.setCommandHandler("contracts:formatted:all", (cb) => {
      const contracts = self.listContracts().map((contract, index) => (
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
      cb(contracts);
    });

    embark.registerAPICall(
      'get',
      '/embark-api/contract/:contractName',
      (req, res) => {
        self.events.request('contracts:contract', req.params.contractName, res.send.bind(res));
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/:contractName/function',
      (req, res) => {
        async.parallel({
          contract: (callback) => {
            self.events.request('contracts:contract', req.body.contractName, (contract) => callback(null, contract));
          },
          account: (callback) => {
            self.events.request("blockchain:defaultAccount:get", (account) => callback(null, account));
          }
        }, (error, result) => {
          if (error) {
            return res.send({error: error.message});
          }
          const {account, contract} = result;
          const abi = contract.abiDefinition.find(definition => definition.name === req.body.method);
          const funcCall = (abi.constant === true || abi.stateMutability === 'view' || abi.stateMutability === 'pure') ? 'call' : 'send';

          self.events.request("blockchain:contract:create", {abi: contract.abiDefinition, address: contract.deployedAddress}, async (contractObj) => {
            try {
              const gas = await contractObj.methods[req.body.method].apply(this, req.body.inputs).estimateGas();
              contractObj.methods[req.body.method].apply(this, req.body.inputs)[funcCall]({from: account, gasPrice: req.body.gasPrice, gas: Math.floor(gas)}, (error, result) => {
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
                  return res.send({result: error.message});
                }

                if(funcCall === 'call') {
                  contractLog.status = '0x1';
                  return res.send({result});
                }

                res.send({result});
              });
            } catch (e) {
              if (funcCall === 'call' && e.message === constants.blockchain.gasAllowanceError) {
                return res.send({result: constants.blockchain.gasAllowanceErrorMessage});
              }
              res.send({result: e.message});
            }
          });
        });
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/:contractName/deploy',
      (req, res) => {
        async.parallel({
          contract: (callback) => {
            self.events.request('contracts:contract', req.body.contractName, (contract) => callback(null, contract));
          },
          account: (callback) => {
            self.events.request("blockchain:defaultAccount:get", (account) => callback(null, account));
          }
        }, (error, result) => {
          if (error) {
            return res.send({error: error.message});
          }
          const {account, contract} = result;

          self.events.request("blockchain:contract:create", {abi: contract.abiDefinition}, async (contractObj) => {
            try {
              const params = {data: `0x${contract.code}`, arguments: req.body.inputs};
              let gas = await contractObj.deploy(params).estimateGas();
              let newContract = await contractObj.deploy(params).send({from: account, gas, gasPrice: req.body.gasPrice});
              res.send({result: newContract._address});
            } catch (e) {
              res.send({result: e.message});
            }
          });
        });
      }
    );

    embark.registerAPICall(
      'get',
      '/embark-api/contracts',
      (_req, res) => {
        res.send(this._contractsForApi());
      }
    );

    embark.registerAPICall(
      'ws',
      '/embark-api/contracts',
      (ws, _res) => {
        this.events.on('contractsDeployed', () => {
          ws.send(JSON.stringify(this._contractsForApi()), () => undefined);
        });
        this.events.on('contractsState', () => {
          ws.send(JSON.stringify(this._contractsForApi()), () => undefined);
        });
      }
    );

    embark.registerAPICall(
      'post',
      '/embark-api/contract/deploy',
      (req, res) => {
        this.logger.trace(`POST request /embark-api/contract/deploy:\n ${JSON.stringify(req.body)}`);
        if(typeof req.body.compiledContract !== 'object'){
          return res.send({error: 'Body parameter \'compiledContract\' must be an object'});
        }
        self.compiledContracts = Object.assign(self.compiledContracts, req.body.compiledContract);
        const contractNames = Object.keys(req.body.compiledContract);
        self.build((err, _mgr) => {
          if(err){
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
            if(err){
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


  _contractsForApi() {
    const result = [];
    this.events.request('contracts:formatted:all', (contracts) => {
      contracts.forEach((contract) => {
        this.events.request('contracts:contract', contract.className, (c) => (
          result.push(Object.assign(contract, c))
        ));
      });
    });
    return result;
  }

  build(done, _useContractFiles = true, resetContracts = true) {
    let self = this;
    self.contracts = {};

    if(resetContracts) self.contracts = {};
    async.waterfall([
      function beforeBuild(callback) {
        self.plugins.emitAndRunActionsForEvent("build:beforeAll", () => {
          callback();
        });
      },
      function loadContractFiles(callback) {
        self.events.request("config:contractsFiles", (contractsFiles) => {
          self.contractsFiles = contractsFiles;
          callback();
        });
      },
      function loadContractConfigs(callback) {
        self.events.request("config:contractsConfig", (contractsConfig) => {
          self.contractsConfig = cloneDeep(contractsConfig);
          callback();
        });
      },
      function allContractsCompiled(callback) {
        const allContractsCompiled =
          self.compiledContracts &&
          self.contractsFiles &&
          self.contractsFiles.every(contractFile =>
            Object.values(self.compiledContracts).find(contract =>
              contract.originalFilename === contractFile.filename
            )
          );
        callback(null, allContractsCompiled);
      },
      function compileContracts(allContractsCompiled, callback) {
        self.events.emit("status", __("Compiling..."));
        const hasCompiledContracts = self.compiledContracts && Object.keys(self.compiledContracts).length;
        if (self.compileOnceOnly && hasCompiledContracts && allContractsCompiled) {
          return callback();
        }
        self.events.request("compiler:contracts", self.contractsFiles, function (err, compiledObject) {
          self.compiledContracts = compiledObject;
          callback(err);
        });
      },
      function prepareContractsFromConfig(callback) {
        self.events.emit("status", __("Building..."));

        // if we are appending contracts (ie fiddle), we
        // don't need to build a contract from config, so
        // we can skip this entirely
        if(!resetContracts) return callback();

        async.eachOf(self.contractsConfig.contracts, (contract, className, eachCb) => {
          if (!contract.artifact) {
            contract.className = className;
            contract.args = contract.args || [];

            self.contracts[className] = contract;
            return eachCb();
          }

          self.fs.readFile(self.fs.dappPath(contract.artifact), (err, artifactBuf) => {
            if (err) {
              self.logger.error(__('Error while reading the artifact for "{{className}}" at {{path}}', {className, path: contract.artifact}));
              return eachCb(err);
            }
            try {
              self.contracts[className] = JSON.parse(artifactBuf.toString());
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
      function getGasPriceForNetwork(callback) {
        return callback(null, self.contractsConfig.gasPrice);
      },
      function prepareContractsForCompilation(gasPrice, callback) {
        for (const className in self.compiledContracts) {
          const compiledContract = self.compiledContracts[className];
          const contractConfig = self.contractsConfig.contracts[className];

          const contract = self.contracts[className] || {className: className, args: []};

          contract.code = compiledContract.code;
          contract.runtimeBytecode = compiledContract.runtimeBytecode;
          contract.realRuntimeBytecode = (compiledContract.realRuntimeBytecode || compiledContract.runtimeBytecode);
          contract.linkReferences = compiledContract.linkReferences;
          contract.swarmHash = compiledContract.swarmHash;
          contract.gasEstimates = compiledContract.gasEstimates;
          contract.functionHashes = compiledContract.functionHashes;
          contract.abiDefinition = compiledContract.abiDefinition;
          contract.filename = compiledContract.filename;
          contract.originalFilename = compiledContract.originalFilename || ("contracts/" + contract.filename);
          contract.path = self.fs.dappPath(contract.originalFilename);

          contract.gas = (contractConfig && contractConfig.gas) || self.contractsConfig.gas || 'auto';

          contract.gasPrice = contract.gasPrice || gasPrice;
          contract.type = 'file';
          contract.className = className;

          if (contract.address) {
            contract.deployedAddress = contract.address;
          }

          self.contracts[className] = contract;
        }
        callback();
      },
      function setDeployIntention(callback) {
        let className, contract;
        for (className in self.contracts) {
          contract = self.contracts[className];
          contract.deploy = (contract.deploy === undefined) || contract.deploy;
          if (self.deployOnlyOnConfig && !self.contractsConfig.contracts[className]) {
            contract.deploy = false;
          }

          if (!self.contractsConfig.contracts[className] && self.contractsConfig.strategy === constants.deploymentStrategy.explicit) {
            contract.deploy = false;
          }

          if (contract.code === "") {
            const message = __("assuming %s to be an interface", className);
            if (contract.silent) {
              self.logger.trace(message);
            } else {
              self.logger.info(message);
            }
            contract.deploy = false;
          }
        }
        callback();
      },
      /*eslint complexity: ["error", 11]*/
      function dealWithSpecialConfigs(callback) {
        let className, contract, parentContractName, parentContract;
        let dictionary = Object.keys(self.contracts);

        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.instanceOf === undefined) {
            continue;
          }

          parentContractName = contract.instanceOf;
          parentContract = self.contracts[parentContractName];

          if (parentContract === className) {
            self.logger.error(__("%s : instanceOf is set to itself", className));
            continue;
          }

          if (parentContract === undefined) {
            self.logger.error(__("{{className}}: couldn't find instanceOf contract {{parentContractName}}", {
              className: className,
              parentContractName: parentContractName
            }));
            let suggestion = utils.proposeAlternative(parentContractName, dictionary, [className, parentContractName]);
            if (suggestion) {
              self.logger.warn(__('did you mean "%s"?', suggestion));
            }
            continue;
          }

          if (parentContract.args && parentContract.args.length > 0 && ((contract.args && contract.args.length === 0) || contract.args === undefined)) {
            contract.args = parentContract.args;
          }

          if (contract.code !== undefined) {
            self.logger.error(__("{{className}} has code associated to it but it's configured as an instanceOf {{parentContractName}}", {
              className: className,
              parentContractName: parentContractName
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
        callback();
      },
      function removeContractsWithNoCode(callback) {
        let className, contract;
        let dictionary = Object.keys(self.contracts);
        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.code === undefined && !contract.abiDefinition) {
            self.logger.error(__("%s has no code associated", className));
            let suggestion = utils.proposeAlternative(className, dictionary, [className]);
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

          // look in arguments for dependencies
          if (contract.args === []) continue;

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
        self.compileError = true;
        self.events.emit("status", __("Compile/Build error"));
        self.events.emit("outputError", __("Error building Dapp, please check console"));
        self.logger.error(__("Error Compiling/Building contracts: ") + err);
      } else {
        self.compileError = false;
      }
      self.logger.trace("finished".underline);
      done(err, self);
    });
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
      orderedDependencies = utils.toposort(converted_dependencies.filter((x) => x[0] !== x[1])).reverse();
    } catch (e) {
      this.logger.error((__("Error: ") + e.message).red);
      this.logger.error(__("there are two or more contracts that depend on each other in a cyclic manner").bold.red);
      this.logger.error(__("Embark couldn't determine which one to deploy first").red);
      throw new Error("CyclicDependencyError");
      //process.exit(0);
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

module.exports = ContractsManager;
