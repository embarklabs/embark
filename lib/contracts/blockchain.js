const Web3 = require('web3');
const async = require('async');
const Provider = require('./provider.js');
const BlockchainProcessLauncher = require('../processes/blockchainProcessLauncher');
const utils = require('../utils/utils');
const constants = require('../constants');

const WEB3_READY = 'web3Ready';

class Blockchain {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.contractsConfig = options.contractsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.web3 = options.web3;
    this.locale = options.locale;
    this.isDev = options.isDev;
    this.web3Endpoint = '';
    this.isWeb3Ready = false;
    this.web3StartedInProcess = false;

    if (!this.web3) {
      this.initWeb3();
    } else {
      this.isWeb3Ready = true;
    }
    this.registerServiceCheck();
    this.registerRequests();
    this.registerWeb3Object();
  }

  initWeb3(cb) {
    if (!cb) {
      cb = function(){};
    }
    if (this.isWeb3Ready) {
      return cb();
    }
    const self = this;
    this.web3 = new Web3();

    if (this.contractsConfig.deployment.type !== "rpc" && this.contractsConfig.deployment.type !== "ws") {
      const message = __("contracts config error: unknown deployment type %s", this.contractsConfig.deployment.type);
      this.logger.error(message);
      return cb(message);
    }

    const protocol = (this.contractsConfig.deployment.type === "rpc") ? this.contractsConfig.deployment.protocol : 'ws';
    
    this.web3Endpoint = utils.buildUrl(protocol, this.contractsConfig.deployment.host, this.contractsConfig.deployment.port);//`${protocol}://${this.contractsConfig.deployment.host}:${this.contractsConfig.deployment.port}`;

    const providerOptions = {
      web3: this.web3,
      accountsConfig: this.contractsConfig.deployment.accounts,
      blockchainConfig: this.blockchainConfig,
      logger: this.logger,
      isDev: this.isDev,
      type: this.contractsConfig.deployment.type,
      web3Endpoint: self.web3Endpoint
    };
    this.provider = new Provider(providerOptions);

    async.waterfall([
      function checkNode(next) {
        self.assertNodeConnection(true, (err) => {
          if (err && self.web3StartedInProcess) {
            // Already started blockchain in another node, we really have a node problem
            self.logger.error(__('Unable to start the blockchain process. Is Geth installed?').red);
            return next(err);
          }
          if (!err) {
            self.isWeb3Ready = true;
            self.events.emit(WEB3_READY);
            // if the ethereum node goes offline, we need a check to ensure
            // the provider is also stopped
            self.events.on('check:wentOffline:Ethereum', () => {
              self.logger.trace('Ethereum went offline: stopping web3 provider...');
              self.provider.stop();
              
              // once the node goes back online, we can restart the provider
              self.events.once('check:backOnline:Ethereum', () => {
                self.logger.trace('Ethereum back online: starting web3 provider...');
                self.provider.startWeb3Provider(() => {
                  self.logger.trace('web3 provider restarted after ethereum node came back online');
                });
              });
            });
            return next();
          }
          self.web3StartedInProcess = true;
          self.startBlockchainNode(() => {
            // Need to re-initialize web3 to connect to the new blockchain node
            self.provider.stop();
            self.initWeb3(cb);
          });
        });
      },
      function startProvider(next) {
        self.provider.startWeb3Provider(next);
      },
      function fundAccountsIfNeeded(next) {
        self.provider.fundAccounts(next);
      }
    ], (err) => {
      self.registerWeb3Object();
      cb(err);
    });
  }

  onReady(callback) {
    if (this.isWeb3Ready) {
      return callback();
    }

    this.events.once(WEB3_READY, () => {
      callback();
    });
  }

  startBlockchainNode(callback) {
    const self = this;
    let blockchainProcess = new BlockchainProcessLauncher({
      events: self.events,
      logger: self.logger,
      normalizeInput: utils.normalizeInput,
      blockchainConfig: self.blockchainConfig,
      locale: self.locale,
      isDev: self.isDev
    });

    blockchainProcess.startBlockchainNode();
    self.events.once(constants.blockchain.blockchainReady, () => {
      callback();
    });
    self.events.once(constants.blockchain.blockchainExit, () => {
      self.provider.stop();
      callback();
    });
  }

  registerServiceCheck() {
    const self = this;
    const NO_NODE = 'noNode';

    this.events.request("services:register", 'Ethereum', function (cb) {
      async.waterfall([
        function checkNodeConnection(next) {
          self.assertNodeConnection(true, (err) => {
            if (err) {
              return next(NO_NODE, {name: "No Blockchain node found", status: 'off'});
            }
            next();
          });
        },
        function checkVersion(next) {
          // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
          self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
            if (err) {
              return next(null, {name: "Ethereum node (version unknown)", status: 'on'});
            }
            if (version.indexOf("/") < 0) {
              return next(null, {name: version, status: 'on'});
            }
            let nodeName = version.split("/")[0];
            let versionNumber = version.split("/")[1].split("-")[0];
            let name = nodeName + " " + versionNumber + " (Ethereum)";

            return next(null, {name: name, status: 'on'});
          });
        }
      ], (err, statusObj) => {
        if (err && err !== NO_NODE) {
          return cb(err);
        }
        cb(statusObj);
      });
    }, 5000, 'off');
  }

  registerRequests() {
    const self = this;

    this.events.setCommandHandler("blockchain:defaultAccount:get", function(cb) {
      cb(self.defaultAccount());
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", function(account, cb) {
      self.setDefaultAccount(account);
      cb();
    });

    this.events.setCommandHandler("blockchain:block:byNumber", function(blockNumber, cb) {
      self.getBlock(blockNumber, cb);
    });

    this.events.setCommandHandler("blockchain:gasPrice", function(cb) {
      self.getGasPrice(cb);
    });

    this.events.setCommandHandler("blockchain:contract:create", function(params, cb) {
      cb(self.ContractObject(params));
    });
  }

  defaultAccount() {
    return this.web3.eth.defaultAccount;
  }

  setDefaultAccount(account) {
    this.web3.eth.defaultAccount = account;
  }

  getAccounts(cb) {
    this.web3.eth.getAccounts(cb);
  }

  getCode(address, cb) {
    this.web3.eth.getCode(address, cb);
  }

  getBlock(blockNumber, cb) {
    this.web3.eth.getBlock(blockNumber, cb);
  }

  getGasPrice(cb) {
    this.web3.eth.getGasPrice(cb);
  }

  ContractObject(params) {
    return new this.web3.eth.Contract(params.abi, params.address);
  }

  deployContractObject(contractObject, params) {
    return contractObject.deploy({arguments: params.arguments, data: params.data});
  }

  estimateDeployContractGas(deployObject, cb) {
    return deployObject.estimateGas().then((gasValue) => {
      cb(null, gasValue);
    }).catch(cb);
  }

  deployContractFromObject(deployContractObject, params, cb) {
    const self = this;
    let hash;
    let calledBacked = false;

    function callback(err, receipt) {
      if (calledBacked) {
        return;
      }
      if (!err && !receipt.contractAddress) {
        return; // Not deployed yet. Need to wait
      }
      if (interval) {
        clearInterval(interval);
      }
      calledBacked = true;
      cb(err, receipt);
    }

    // This interval is there to compensate for the event that sometimes doesn't get triggered when using WebSocket
    // FIXME The issue somehow only happens when the blockchain node is started in the same terminal
    const interval = setInterval(() => {
      if (!hash) {
        return; // Wait until we receive the hash
      }
      self.web3.eth.getTransactionReceipt(hash, (err, receipt) => {
        if (!err && !receipt) {
          return; // Transaction is not yet complete
        }
        callback(err, receipt);
      });
    }, 500);

    deployContractObject.send({
      from: params.from, gas: params.gas, gasPrice: params.gasPrice
    }, function (err, transactionHash) {
      if (err) {
        return callback(err);
      }
      hash = transactionHash;
    })
      .on('receipt', function (receipt) {
        if (receipt.contractAddress !== undefined) {
          callback(null, receipt);
        }
      })
      .then(function (_contract) {
        if (!hash) {
          return; // Somehow we didn't get the receipt yet... Interval will catch it
        }
        self.web3.eth.getTransactionReceipt(hash, callback);
      })
      .catch(callback);
  }

  assertNodeConnection(noLogs, cb) {
    if (typeof noLogs === 'function') {
      cb = noLogs;
      noLogs = false;
    }
    const NO_NODE_ERROR = Error("error connecting to blockchain node");
    const self = this;

    async.waterfall([
      function checkInstance(next) {
        if (!self.web3) {
          return next(Error("no web3 instance found"));
        }
        next();
      },
      function checkProvider(next) {
        if (self.web3.currentProvider === undefined) {
          return next(NO_NODE_ERROR);
        }
        next();
      },
      function pingEndpoint(next) {
        if (!self.contractsConfig || !self.contractsConfig.deployment || !self.contractsConfig.deployment.host) {
          return next();
        }
        const {host, port, type, protocol}  = self.contractsConfig.deployment;
        utils.pingEndpoint(host, port, type, protocol, self.blockchainConfig.wsOrigins.split(',')[0], next);
      }
    ], function (err) {
      if (!noLogs && err === NO_NODE_ERROR) {
        self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
        self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
      }
      cb(err);
    });
  }

  determineDefaultAccount(cb) {
    const self = this;
    self.getAccounts(function (err, accounts) {
      if (err) {
        self.logger.error(err);
        return cb(new Error(err));
      }
      let accountConfig = self.blockchainConfig.account;
      let selectedAccount = accountConfig && accountConfig.address;
      self.setDefaultAccount(selectedAccount || accounts[0]);
      cb();
    });
  }

  registerWeb3Object() {
    // doesn't feel quite right, should be a cmd or plugin method
    // can just be a command without a callback
    this.events.emit("runcode:register", "web3", this.web3);
  }
}

module.exports = Blockchain;

