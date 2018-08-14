const Web3 = require('web3');
const async = require('async');
const Provider = require('./provider.js');
const utils = require('../../utils/utils');
const constants = require('../../constants');
const embarkJsUtils = require('embarkjs').Utils;

const WEB3_READY = 'web3Ready';

// TODO: consider another name, this is the blockchain connector
class BlockchainConnector {
  constructor(embark, options) {
    const self = this;
    this.plugins = options.plugins;
    this.logger = embark.logger;
    this.events = embark.events;
    this.contractsConfig = embark.config.contractsConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.web3 = options.web3;
    this.isDev = options.isDev;
    this.web3Endpoint = '';
    this.isWeb3Ready = false;

    self.events.setCommandHandler("blockchain:web3:isReady", (cb) => {
      cb(self.isWeb3Ready);
    });

    self.events.setCommandHandler("blockchain:object", (cb) => {
      cb(self);
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
    this.subscribeToPendingTransactions();
  }

  //initWeb3() {
  initWeb3(cb) {
    if (!cb) {
      cb = function(){};
    }
    if (this.isWeb3Ready) {
      this.events.emit(WEB3_READY);
      return cb();
    }

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
        this.web3.eth.net.getId()
          .then(id => {
            let networkId = self.blockchainConfig.networkId;
            if (!networkId && constants.blockchain.networkIds[self.blockchainConfig.networkType]) {
              networkId = constants.blockchain.networkIds[self.blockchainConfig.networkType];
            }
            if (id.toString() !== networkId.toString()) {
              self.logger.warn(__('Connected to a blockchain node on network {{realId}} while your config specifies {{configId}}', {realId: id, configId: networkId}));
              self.logger.warn(__('Make sure you started the right blockchain node'));
            }
          })
          .catch(console.error);
        self.provider.fundAccounts(() => {
          self.isWeb3Ready = true;
          self.events.emit(WEB3_READY);
          self.registerWeb3Object();
        });
      });
    });
  }

  registerEvents() {
    const self = this;
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
    embarkJsUtils.secureSend(this.web3, deployContractObject, {
      from: params.from, gas: params.gas, gasPrice: params.gasPrice
    }, true, cb);
  }

  determineDefaultAccount(cb) {
    const self = this;
    self.getAccounts(function(err, accounts) {
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

  subscribeToPendingTransactions() {
    const self = this;
    this.onReady(() => {
      if (self.logsSubscription) {
        self.logsSubscription.unsubscribe();
      }
      self.logsSubscription = self.web3.eth
        .subscribe('newBlockHeaders', () => {})
        .on("data", function (blockHeader) {
          self.events.emit('block:header', blockHeader);
        });
    });
  }
}

module.exports = BlockchainConnector;

