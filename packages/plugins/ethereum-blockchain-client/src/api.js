import async from "async";
import {dappPath, getAppendLogFileCargo, readAppendedLogs} from 'embark-utils';
const embarkJsUtils = require('embarkjs').Utils;
const {bigNumberify} = require('ethers/utils/bignumber');
const RLP = require('ethers/utils/rlp');
const ethUtil = require('ethereumjs-util');
let { Manager } = require('web3-core-requestmanager');

const BLOCK_LIMIT = 100;

export default class EthereumAPI {
  constructor(embark, web3, blockchainName) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.blockchainName = blockchainName;
    this.web3 = web3;
    this.requestManager = new Manager(web3.currentProvider);
    this.fs = embark.fs;
    this.logFile = dappPath(".embark", "contractEvents.json.txt");
    this.contractsSubscriptions = [];
    this.contractsEvents = [];

    this.writeLogFile = getAppendLogFileCargo(this.logFile, this.logger);
    this.events.on('contractsDeployed', () => {
      this.subscribeToContractEvents();
    });
  }

  registerAPIs() {
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getAccountsWithTransactionCount", this.getAccountsWithTransactionCount.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getAccount", this.getAccount.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getBlocks", this.getBlocks.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getBlock", this.getBlock.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getTransactions", this.getTransactions.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getTransactionByHash", this.getTransactionByHash.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getTransactionByRawTransactionHash", this.getTransactionByRawTransactionHash.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "getEvents", this.readEvents.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "signMessage", this.signMessage.bind(this));
    this.embark.events.request("blockchain:api:register", this.blockchainName, "verifyMessage", this.verifyMessage.bind(this));
  }

  registerRequests() {
    this.embark.events.request("blockchain:request:register", this.blockchainName, "blockchainObject", async () => {
      return this.web3;
    });
    // TODO: Re-add init web3? The initWeb3 method should come from the legacy embark-blockchain-connector
    // this.embark.events.request("blockchain:request:register", this.blockchainName, "initWeb3", this.initWeb3.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getDefaultAccount", this.defaultAccount.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "setDefaultAccount", this.setDefaultAccount.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getAccounts", this.getAccounts.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getBalance", this.getBalance.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getBlock", this.getBlock.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getGasPrice", this.getGasPrice.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getNetworkId", this.getNetworkId.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "getTransaction", this.getTransactionByHash.bind(this));
    this.embark.events.request("blockchain:request:register", this.blockchainName, "contractObject", this.contractObject.bind(this));
  }

  getAccountsWithTransactionCount(callback) {
    let self = this;
    self.getAccounts((err, addresses) => {
      let accounts = [];
      async.eachOf(addresses, (address, index, eachCb) => {
        let account = {address, index};
        async.waterfall([
          function (callback) {
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
          function (account, callback) {
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
        ], function (_err, account) {
          accounts.push(account);
          eachCb();
        });
      }, function () {
        callback(accounts);
      });
    });
  }

  getAccount(address, callback) {
    let self = this;
    async.waterfall([
      function (next) {
        self.getAccountsWithTransactionCount((accounts) => {
          let account = accounts.find((a) => a.address === address);
          if (!account) {
            return next("No account found with this address");
          }
          next(null, account);
        });
      },
      function (account, next) {
        self.getBlockNumber((err, blockNumber) => {
          if (err) {
            self.logger.error(err);
            next(err);
          } else {
            next(null, blockNumber, account);
          }
        });
      },
      function (blockNumber, account, next) {
        self.getTransactions(blockNumber - BLOCK_LIMIT, BLOCK_LIMIT, (transactions) => {
          account.transactions = transactions.filter((transaction) => transaction.from === address);
          next(null, account);
        });
      }
    ], function (err, result) {
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
      function (next) {
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
      function (next) {
        if (from - limit < 0) {
          limit = from + 1;
        }
        async.times(limit, (n, eachCb) => {
          self.web3.eth.getBlock(from - n, returnTransactionObjects, (err, block) => {
            if (err) {
              return eachCb(err);
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
    ], function () {
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
    } catch (e) {
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

    self.web3.eth.getGasPrice(cb);
  }

  getClientVersion(cb) {
    this.requestManager.send({method: 'web3_clientVersion', params: []}, cb);
  }

  getNetworkId(cb) {
    return this.web3.eth.net.getId(cb);
  }

  getTransaction(hash, cb) {
    return this.web3.eth.getTransaction(hash, cb);
  }

  contractObject(params) {
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
    self.getAccounts(function (err, accounts) {
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
    if (self.logsSubscription) {
      self.logsSubscription.unsubscribe();
    }
    self.logsSubscription = self.web3.eth
      .subscribe('newBlockHeaders', () => {
      })
      .on("data", function(blockHeader) {
        self.events.emit('block:header', blockHeader);
      });

    if (self.pendingSubscription) {
      self.pendingSubscription.unsubscribe();
    }
    self.pendingSubscription = self.web3.eth
      .subscribe('pendingTransactions', function(error, transaction) {
        if (!error) {
          self.events.emit('block:pending:transaction', transaction);
        }
      });
  }

  subscribeToContractEvents() {
    this.contractsSubscriptions.forEach((eventEmitter) => {
      const reqMgr = eventEmitter.options.requestManager;
      // attempting an eth_unsubscribe when not connected throws an
      // "connection not open on send()" error
      if (reqMgr && reqMgr.provider && reqMgr.provider.connected) {
        eventEmitter.unsubscribe();
      }
    });
    this.contractsSubscriptions = [];
    this.events.request("contracts:list", (_err, contractsList) => {
      contractsList.forEach(contractObject => {
        if (!contractObject.deployedAddress) {
          return;
        }

        const contract = this.contractObject({abi: contractObject.abiDefinition, address: contractObject.deployedAddress});
        const eventEmitter = contract.events.allEvents();
        this.contractsSubscriptions.push(eventEmitter);
        eventEmitter.on('data', (data) => {
          const dataWithName = Object.assign(data, {name: contractObject.className});
          this.contractsEvents.push(dataWithName);
          this.saveEvent(dataWithName);
          this.events.emit('blockchain:contracts:event', dataWithName);
        });
      });
    });
  }

  saveEvent(event) {
    this.writeLogFile.push(event);
  }

  async readEvents(asString) {
    try {
      return readAppendedLogs(this.logFile, asString);
    } catch (e) {
      this.logger.error('Error reading contract log file', e.message);
      this.logger.trace(e.trace);
      return asString ? '[]' : [];
    }
  }

  async signMessage(message, signer) {
    return this.web3.eth.sign(message, signer);
  }

  async verifyMessage(message, signature) {
    return this.web3.eth.personal.ecRecover(message, signature);
  }
}
