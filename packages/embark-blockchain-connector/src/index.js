import { __ } from 'embark-i18n';
const Web3 = require('web3');
const async = require('async');
const Provider = require('./provider.js');
const ethUtil = require('ethereumjs-util');
const constants = require('embark-core/constants');
const embarkJsUtils = require('embarkjs').Utils;
const {bigNumberify} = require('ethers/utils/bignumber');
const RLP = require('ethers/utils/rlp');
import { buildUrl, dappPath } from 'embark-utils';

const WEB3_READY = 'blockchain:ready';

const BLOCK_LIMIT = 100;

// TODO: consider another name, this is the blockchain connector
class BlockchainConnector {
  constructor(embark, options) {
    const self = this;
    this.embark = embark;
    this.plugins = options.plugins;
    this.logger = embark.logger;
    this.events = embark.events;
    this.config = embark.config;
    this.web3 = options.web3;
    this.isDev = options.isDev;
    this.web3Endpoint = '';
    this.isWeb3Ready = false;
    this.wait = options.wait;
    this.contractsSubscriptions = [];
    this.contractsEvents = [];
    this.fs = embark.fs;
    this.logFile = dappPath(".embark", "contractEvents.json");

    this.writeLogFile = async.cargo((tasks, callback) => {
      const data = this._readEvents();

      tasks.forEach(task => {
        data[new Date().getTime()] = task;
      });

      this.fs.writeJson(this.logFile, data, err => {
        if (err) {
          console.error(err);
        }
        callback();
      });
    });

    self.events.setCommandHandler("blockchain:ready", self.onReady.bind(this));

    self.events.setCommandHandler("blockchain:web3:isReady", (cb) => {
      cb(self.isWeb3Ready);
    });

    self.events.setCommandHandler("blockchain:object", (cb) => {
      cb(self);
    });

    self.events.setCommandHandler("blockchain:getTransaction", (txHash, cb) => {
      self.getTransactionByHash(txHash, cb);
    });

    embark.registerActionForEvent("contracts:deploy:afterAll", this.subscribeToContractEvents.bind(this));

    if (!this.web3) {
      this.initWeb3(err => {
        if (err) {
          this.logger.error(__('Error initiating Web3 provider'), err.message || err);
        }
      });
    } else {
      this.isWeb3Ready = true;
    }

    this.registerServiceCheck();
    this.registerRequests();
    this.registerAPIRequests();
    this.registerEvents();
    this.subscribeToPendingTransactions();
  }

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

    if (self.wait) {
      self.wait = false;
      return cb();
    }

    let {type, host, port, accounts, protocol, coverage} = this.config.contractsConfig.deployment;
    if (!protocol) {
      protocol = (type === "rpc") ? 'http' : 'ws';
    }

    if (!BlockchainConnector.ACCEPTED_TYPES.includes(type)) {
      this.logger.error(__("contracts config error: unknown deployment type %s", type));
      this.logger.error(__("Accepted types are: %s", BlockchainConnector.ACCEPTED_TYPES.join(', ')));
    }

    if (type === 'rpc') {
      this.logger.warn('Using RPC as deployment connection type is deprecated. It is recommended to use WS.');
    }

    if (type === 'vm') {
      const sim = self._getSimulator();
      const options = Object.assign({}, self.config.contractsConfig.deployment, {
        gasPrice: "0x01",
        gasLimit: "0xfffffffffffff",
        allowUnlimitedContractSize: coverage
      });
      self.provider = sim.provider(options);

      if (coverage) {
        // Here we patch the sendAsync method on the provider. The goal behind this is to force pure/constant/view calls to become
        // transactions, so that we can pull in execution traces and account for those executions in code coverage.
        //
        // Instead of a simple call, here's what happens:
        //
        // 1) A transaction is sent with the same payload, and a pre-defined gas price;
        // 2) We wait for the transaction to be mined by asking for the receipt;
        // 3) Once we get the receipt back, we dispatch the real call and pass the original callback;
        //
        // This will still allow tests to get the return value from the call and run contracts unmodified.
        self.provider.realSendAsync = self.provider.sendAsync.bind(self.provider);
        self.provider.sendAsync = function(payload, cb) {
          if(payload.method !== 'eth_call') {
            return self.provider.realSendAsync(payload, cb);
          }
          self.events.request('reporter:toggleGasListener');
          let newParams = Object.assign({}, payload.params[0]);
          let newPayload = {
            id: payload.id + 1,
            method: constants.blockchain.transactionMethods.eth_sendTransaction,
            params: [newParams],
            jsonrpc: payload.jsonrpc
          };

          self.provider.realSendAsync(newPayload, (_err, response) => {
            let txHash = response.result;
            self.web3.eth.getTransactionReceipt(txHash, (_err, _res) => {
              self.events.request('reporter:toggleGasListener');
              self.provider.realSendAsync(payload, cb);
            });
          });
        };
      }

      self.web3.setProvider(self.provider);
      self._emitWeb3Ready();
      return cb();
    }

    protocol = (type === "rpc") ? protocol : 'ws';

    this.web3Endpoint = buildUrl(protocol, host, port);

    const providerOptions = {
      web3: this.web3,
      accountsConfig: accounts,
      blockchainConfig: this.config.blockchainConfig,
      logger: this.logger,
      isDev: this.isDev,
      type: type,
      web3Endpoint: self.web3Endpoint,
      events: this.events,
      fs: this.fs
    };
    this.provider = new Provider(providerOptions);

    self.events.request("processes:launch", "blockchain", (err) => {
      if (err) {
        return self.logger.error(err);
      }
      self.provider.startWeb3Provider(async (err) => {
        if (err) {
          return cb(err);
        }
        try {
          const blockNumber = await self.web3.eth.getBlockNumber();
          await self.web3.eth.getBlock(blockNumber);
          self.provider.fundAccounts(() => {
            self._emitWeb3Ready();
            cb();
          });
        } catch (e) {
          const errorMessage = e.message || e;
          if (errorMessage.indexOf('no suitable peers available') > 0) {
            self.logger.warn(errorMessage);
            self.logger.warn(__('Your node is probably not synchronized. Wait until your node is synchronized before deploying'));
            process.exit(1);
          }
          self.logger.error(errorMessage);
          cb(errorMessage);
        }

        try {
          const id = await this.getNetworkId();
          let networkId = self.config.blockchainConfig.networkId;
          if (!networkId &&
            constants.blockchain.networkIds[self.config.blockchainConfig.networkType]) {
            networkId = constants.blockchain.networkIds[self.config.blockchainConfig.networkType];
          }
          if (networkId && id.toString() !== networkId.toString()) {
            self.logger.warn(__('Connected to a blockchain node on network {{realId}} while your config specifies {{configId}}', {realId: id, configId: networkId}));
            self.logger.warn(__('Make sure you started the right blockchain node'));
          }
        } catch (e) {
          console.error(e);
        }
      });
    });
  }

  _emitWeb3Ready() {
    this.registerWeb3Object(() => {
      this.isWeb3Ready = true;
      this.events.emit(WEB3_READY);
    });
    this.subscribeToPendingTransactions();
  }

  _getSimulator() {
    try {
      return require('ganache-cli');
    } catch (e) {
      const moreInfo = 'For more information see https://github.com/trufflesuite/ganache-cli';
      if (e.code === 'MODULE_NOT_FOUND') {
        this.logger.error(__('Simulator not found; Please install it with "%s"', 'npm install ganache-cli --save'));
        this.logger.error(moreInfo);
        throw e;
      }
      this.logger.error("==============");
      this.logger.error(__("Tried to load Ganache CLI (testrpc), but an error occurred. This is a problem with Ganache CLI"));
      this.logger.error(moreInfo);
      this.logger.error("==============");
      throw e;
    }
  }

  registerEvents() {
    this.events.on('check:wentOffline:Ethereum', () => {
      this.logger.warn('Ethereum went offline: stopping web3 provider...');
      this.provider.stop();
      this.isWeb3Ready = false;
    });

    this.events.on('blockchain:contracts:event', this._saveEvent.bind(this));
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

    this.events.request("services:register", 'Ethereum', function(cb) {
      async.waterfall([
        function checkNodeConnection(next) {
          if (!self.provider || !self.provider.connected()) {
            return next(NO_NODE, {name: "No Blockchain node found", status: 'off'});
          }
          next();
        },
        function checkVersion(next) {
          // TODO: web3_clientVersion method is currently not implemented in web3.js 1.x
          self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
            if (err || !version) {
              self.isWeb3Ready = false;
              return next(null, {name: "Ethereum node not found", status: 'off'});
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

    this.events.setCommandHandler("blockchain:reset", function(cb) {
      self.isWeb3Ready = false;
      self.initWeb3((err) => {
        if (err) {
          return cb(err);
        }
        self.events.emit('blockchain:reseted');
        cb();
      });
    });

    this.events.setCommandHandler("blockchain:get", function(cb) {
      cb(self.web3);
    });

    this.events.setCommandHandler("blockchain:defaultAccount:get", function(cb) {
      cb(self.defaultAccount());
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", function(account, cb) {
      self.setDefaultAccount(account);
      cb();
    });

    this.events.setCommandHandler("blockchain:getAccounts", function(cb) {
      self.getAccounts(cb);
    });

    this.events.setCommandHandler("blockchain:getBalance", function(address, cb) {
      self.getBalance(address, cb);
    });

    this.events.setCommandHandler("blockchain:block:byNumber", function(blockNumber, cb) {
      self.getBlock(blockNumber, cb);
    });

    this.events.setCommandHandler("blockchain:block:byHash", function(blockHash, cb) {
      self.getBlock(blockHash, cb);
    });

    this.events.setCommandHandler("blockchain:gasPrice", function(cb) {
      self.getGasPrice(cb);
    });

    this.events.setCommandHandler("blockchain:networkId", function(cb) {
      self.getNetworkId().then(cb);
    });

    this.events.setCommandHandler("blockchain:contract:create", function(params, cb) {
      cb(self.ContractObject(params));
    });
  }

  registerAPIRequests() {
    const self = this;

    let plugin = self.plugins.createPlugin('blockchain', {});
    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/accounts',
      (req, res) => {
        self.getAccountsWithTransactionCount(res.send.bind(res));
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/accounts/:address',
      (req, res) => {
        self.getAccount(req.params.address, res.send.bind(res));
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/blocks',
      (req, res) => {
        const from = parseInt(req.query.from, 10);
        const limit = req.query.limit || 10;
        self.getBlocks(from, limit, !!req.query.txObjects, !!req.query.txReceipts, res.send.bind(res));
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/blocks/:blockNumber',
      (req, res) => {
        self.getBlock(req.params.blockNumber, (err, block) => {
          if (err) {
            self.logger.error(err);
          }
          res.send(block);
        });
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/transactions',
      (req, res) => {
        let blockFrom = parseInt(req.query.blockFrom, 10);
        let blockLimit = req.query.blockLimit || 10;
        self.getTransactions(blockFrom, blockLimit, res.send.bind(res));
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/transactions/:hash',
      (req, res) => {
        self.getTransactionByHash(req.params.hash, (err, transaction) => {
          if (!err) return res.send(transaction);

          self.getTransactionByRawTransactionHash(req.params.hash, (err, transaction) => {
            if(err) return res.send({ error: "Could not find or decode transaction hash" });
            res.send(transaction);
          });
        });
      }
    );

    plugin.registerAPICall(
      'ws',
      '/embark-api/blockchain/blockHeader',
      (ws) => {
        self.events.on('block:header', (block) => {
          ws.send(JSON.stringify({block: block}), () => {});
        });
      }
    );

    plugin.registerAPICall(
      'ws',
      '/embark-api/blockchain/contracts/event',
      (ws) => {
        this.events.on('blockchain:contracts:event', (data) => {
          ws.send(JSON.stringify(data), () => {});
        });
      }
    );

    plugin.registerAPICall(
      'get',
      '/embark-api/blockchain/contracts/events',
      (_req, res) => {
        res.send(JSON.stringify(this._getEvents()));
      }
    );

    plugin.registerAPICall(
      'post',
      '/embark-api/messages/sign',
      (req, res) => {
        const signer = req.body.address;
        const message = req.body.message;
        this.web3.eth.sign(message, signer).then(signature => {
          res.send({signer, signature, message});
        }).catch(e => res.send({ error: e.message }));
      }
    );

    plugin.registerAPICall(
      'post',
      '/embark-api/messages/verify',
      (req, res) => {
        let signature;
        try {
          signature = JSON.parse(req.body.message);
        } catch(e) {
          return res.send({ error: e.message });
        }

        this.web3.eth.personal.ecRecover(signature.message, signature.signature)
          .then(address => res.send({address}))
          .catch(e => res.send({ error: e.message }));
      }
    );
  }

  getAccountsWithTransactionCount(callback) {
    let self = this;
    self.getAccounts((err, addresses) => {
      let accounts = [];
      async.eachOf(addresses, (address, index, eachCb) => {
        let account = {address, index};
        async.waterfall([
          function(callback) {
            self.getTransactionCount(address, (err, count) => {
              if (err) {
                self.logger.error(err);
                account.transactionCount = 0;
              } else {
                account.transactionCount = count;
              }
              callback(null, account);
            });
          },
          function(account, callback) {
            self.getBalance(address, (err, balance) => {
              if (err) {
                self.logger.error(err);
                account.balance = 0;
              } else {
                account.balance = self.web3.utils.fromWei(balance);
              }
              callback(null, account);
            });
          }
        ], function(_err, account) {
          accounts.push(account);
          eachCb();
        });
      }, function() {
        callback(accounts);
      });
    });
  }

  getAccount(address, callback) {
    let self = this;
    async.waterfall([
      function(next) {
        self.getAccountsWithTransactionCount((accounts) => {
          let account = accounts.find((a) => a.address === address);
          if (!account) {
            return next("No account found with this address");
          }
          next(null, account);
        });
      },
      function(account, next) {
        self.getBlockNumber((err, blockNumber) => {
          if (err) {
            self.logger.error(err);
            next(err);
          } else {
            next(null, blockNumber, account);
          }
        });
      },
      function(blockNumber, account, next) {
        self.getTransactions(blockNumber - BLOCK_LIMIT, BLOCK_LIMIT, (transactions) => {
          account.transactions = transactions.filter((transaction) => transaction.from === address);
          next(null, account);
        });
      }
    ], function(err, result) {
      if (err) {
        callback();
      }
      callback(result);
    });
  }

  getTransactions(blockFrom, blockLimit, callback) {
    this.getBlocks(blockFrom, blockLimit, true, true, (blocks) => {
      let transactions = blocks.reduce((acc, block) => {
        if (!block || !block.transactions) {
          return acc;
        }
        return acc.concat(block.transactions);
      }, []);
      callback(transactions);
    });
  }

  getBlocks(from, limit, returnTransactionObjects, includeTransactionReceipts, callback) {
    let self = this;
    let blocks = [];
    async.waterfall([
      function(next) {
        if (!isNaN(from)) {
          return next();
        }
        self.getBlockNumber((err, blockNumber) => {
          if (err) {
            self.logger.error(err);
            from = 0;
          } else {
            from = blockNumber;
          }
          next();
        });
      },
      function(next) {
        async.times(limit, function(n, eachCb) {
          self.web3.eth.getBlock(from - n, returnTransactionObjects, function(err, block) {
            if (err) {
              // FIXME Returns an error because we are too low
              return eachCb();
            }
            if (!block) {
              return eachCb();
            }
            if (!(returnTransactionObjects && includeTransactionReceipts) ||
                !(block.transactions && block.transactions.length)) {
              blocks.push(block);
              return eachCb();
            }
            return Promise.all(block.transactions.map(tx => (
              self.web3.eth.getTransactionReceipt(tx.hash)
            )))
              .then(receipts => {
                block.transactions.forEach((tx, index) => {
                  tx['receipt'] = receipts[index];
                  tx['timestamp'] = block.timestamp;
                });
                blocks.push(block);
                eachCb();
              })
              .catch((err) => {
                self.logger.error(err.message || err);
                eachCb();
              });
          });
        }, next);
      }
    ], function() {
      callback(blocks);
    });
  }

  defaultAccount() {
    return this.web3.eth.defaultAccount;
  }

  getBlockNumber(cb) {
    return this.web3.eth.getBlockNumber(cb);
  }

  setDefaultAccount(account) {
    this.web3.eth.defaultAccount = account;
  }

  getAccounts(cb) {
    this.web3.eth.getAccounts(cb);
  }

  getTransactionCount(address, cb) {
    this.web3.eth.getTransactionCount(address, cb);
  }

  getBalance(address, cb) {
    this.web3.eth.getBalance(address, cb);
  }

  getCode(address, cb) {
    this.web3.eth.getCode(address, cb);
  }

  getBlock(blockNumber, cb) {
    this.web3.eth.getBlock(blockNumber, true, (err, block) => {
      if (err) return cb(err);
      if (block.transactions && block.transactions.length) {
        block.transactions.forEach(tx => {
          tx.timestamp = block.timestamp;
        });
      }
      cb(null, block);
    });
  }

  getTransactionByHash(hash, cb) {
    this.web3.eth.getTransaction(hash, cb);
  }

  getTransactionByRawTransactionHash(hash, cb) {
    let rawData, decoded;

    try {
      rawData = Buffer.from(ethUtil.stripHexPrefix(hash), 'hex');
      decoded = RLP.decode(rawData);
    } catch(e) {
      return cb("could not decode transaction");
    }

    const [
      nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
      v,
      r,
      s
    ] = decoded;

    const transaction = {
      nonce: bigNumberify(nonce).toNumber(),
      gasPrice: bigNumberify(gasPrice).toNumber(),
      gasLimit: bigNumberify(gasLimit).toNumber(),
      data: data,
      v: `0x${v.toString('hex').toLowerCase()}`,
      r: `0x${r.toString('hex').toLowerCase()}`,
      s: `0x${s.toString('hex').toLowerCase()}`,
      value: value.toString('utf8'),
      to: `0x${to.toString('hex').toLowerCase()}`
    };

    cb(null, transaction);
  }

  getGasPrice(cb) {
    const self = this;
    this.onReady(() => {
      self.web3.eth.getGasPrice(cb);
    });
  }

  getClientVersion(cb) {
    this.web3._requestManager.send({method: 'web3_clientVersion', params: []}, cb);
  }

  getNetworkId() {
    return this.web3.eth.net.getId();
  }

  getTransaction(hash, cb) {
    return this.web3.eth.getTransaction(hash, cb);
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

  deployContractFromObject(deployContractObject, params, cb, hashCb) {
    embarkJsUtils.secureSend(this.web3, deployContractObject, {
      from: params.from, gas: params.gas, gasPrice: params.gasPrice
    }, true, cb, hashCb);
  }

  determineDefaultAccount(cb) {
    const self = this;
    self.getAccounts(function(err, accounts) {
      if (err) {
        self.logger.error(err);
        return cb(new Error(err));
      }
      let accountConfig = self.config.blockchainConfig.account;
      let selectedAccount = accountConfig && accountConfig.address;
      const defaultAccount = selectedAccount || accounts[0];
      self.setDefaultAccount(defaultAccount);
      cb(null, defaultAccount);
    });
  }

  registerWeb3Object(cb = () => {}) {
    // doesn't feel quite right, should be a cmd or plugin method
    // can just be a command without a callback
    this.events.emit("runcode:register", "web3", this.web3, cb);
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

      if (self.pendingSubscription) {
        self.pendingSubscription.unsubscribe();
      }
      self.pendingSubscription = self.web3.eth
        .subscribe('pendingTransactions', function(error, transaction){
          if (!error) {
            self.events.emit('block:pending:transaction', transaction);
          }
        });
    });
  }

  subscribeToContractEvents(callback) {
    this.contractsSubscriptions.forEach((eventEmitter) => {
      const reqMgr = eventEmitter.options.requestManager;
      // attempting an eth_unsubscribe when not connected throws an
      // "connection not open on send()" error
      if(reqMgr && reqMgr.provider && reqMgr.provider.connected) {
        eventEmitter.unsubscribe();
      }
    });
    this.contractsSubscriptions = [];
    this.events.request("contracts:list", (_err, contractsList) => {
      contractsList.forEach(contractObject => {
        if (!contractObject.deployedAddress){
          return;
        }

        const contract = this.ContractObject({abi: contractObject.abiDefinition, address: contractObject.deployedAddress});
        const eventEmitter = contract.events.allEvents();
        this.contractsSubscriptions.push(eventEmitter);
        eventEmitter.on('data', (data) => {
          const dataWithName = Object.assign(data, {name: contractObject.className});
          this.contractsEvents.push(dataWithName);
          this.events.emit('blockchain:contracts:event', dataWithName);
        });
      });
      callback();
    });
  }

  _getEvents() {
    const data = this._readEvents();
    return Object.values(data).reverse();
  }

  _saveEvent(event) {
    this.writeLogFile.push(event);
  }

  _readEvents() {
    this.fs.ensureFileSync(this.logFile);
    try {
      return JSON.parse(this.fs.readFileSync(this.logFile));
    } catch(_error) {
      return {};
    }
  }
}

BlockchainConnector.ACCEPTED_TYPES = ['rpc', 'ws', 'vm'];
module.exports = BlockchainConnector;
