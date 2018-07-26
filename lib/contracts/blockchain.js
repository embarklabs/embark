const Web3 = require('web3');
const async = require('async');
const Provider = require('./provider.js');
const utils = require('../utils/utils');

const WEB3_READY = 'web3Ready';

// TODO: consider another name, this is the blockchain connector
class Blockchain {
  constructor(options) {
    const self = this;
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.contractsConfig = options.contractsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.web3 = options.web3;
    this.isDev = options.isDev;
    this.web3Endpoint = '';
    this.isWeb3Ready = false;
    this.web3StartedInProcess = false;

    self.events.setCommandHandler("blockchain:web3:isReady", (cb) => {
      cb(self.isWeb3Ready);
    });

    if (!this.web3) {
      this.initWeb3();
    } else {
      this.isWeb3Ready = true;
    }
    this.registerServiceCheck();
    this.registerRequests();
    this.registerWeb3Object();
    this.registerEvents();

  }

  initWeb3() {
    const self = this;
    this.web3 = new Web3();

    if (this.contractsConfig.deployment.type !== "rpc" && this.contractsConfig.deployment.type !== "ws") {
      const message = __("contracts config error: unknown deployment type %s", this.contractsConfig.deployment.type);
      this.logger.error(message);
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

    self.events.request("processes:launch", "blockchain", () => {
      self.provider.startWeb3Provider(() => {
        self.provider.fundAccounts(() => {
          self.isWeb3Ready = true;
          self.events.emit(WEB3_READY);
          self.registerWeb3Object();
        });
      });
    });
  }

  registerEvents() {
    //const self = this;
    //self.events.on('check:wentOffline:Ethereum', () => {
    //  self.logger.trace('Ethereum went offline: stopping web3 provider...');
    //  self.provider.stop();

    //  // once the node goes back online, we can restart the provider
    //  self.events.once('check:backOnline:Ethereum', () => {
    //    self.logger.trace('Ethereum back online: starting web3 provider...');
    //    self.provider.startWeb3Provider(() => {
    //      self.logger.trace('web3 provider restarted after ethereum node came back online');
    //    });
    //  });
    //});
  }

  onReady(callback) {
    if (this.isWeb3Ready) {
      return callback();
    }

    this.events.once(WEB3_READY, () => {
      callback();
    });
  }

  registerServiceCheck() {
    const self = this;
    const NO_NODE = 'noNode';

    this.events.request("services:register", 'Ethereum', function (cb) {
      async.waterfall([
        function checkNodeConnection(next) {
          if (!self.web3.currentProvider) {
            return next(NO_NODE, {name: "No Blockchain node found", status: 'off'});
          }
          next();
        },
        function checkVersion(next) {
          // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
          self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
            if (err) {
              self.isWeb3Ready = false;
              return next(null, {name: "Ethereum node (version unknown)", status: 'on'});
            }
            if (version.indexOf("/") < 0) {
              self.events.emit(WEB3_READY);
              self.isWeb3Ready = true;
              return next(null, {name: version, status: 'on'});
            }
            let nodeName = version.split("/")[0];
            let versionNumber = version.split("/")[1].split("-")[0];
            let name = nodeName + " " + versionNumber + " (Ethereum)";

            self.events.emit(WEB3_READY);
            self.isWeb3Ready = true;
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
    const self = this;
    this.onReady(() => {
      self.web3.eth.getGasPrice(cb);
    });
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
    }).on('receipt', function (receipt) {
      if (receipt.contractAddress !== undefined) {
        callback(null, receipt);
      }
    }).then(function (_contract) {
      if (!hash) {
        return; // Somehow we didn't get the receipt yet... Interval will catch it
      }
      self.web3.eth.getTransactionReceipt(hash, callback);
    }).catch(callback);
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

