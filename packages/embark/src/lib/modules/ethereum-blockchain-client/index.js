import {__} from 'embark-i18n';
import {AddressUtils} from 'embark-utils';
const async = require('async');
const Web3 = require('web3');
const embarkJsUtils = require('embarkjs').Utils;
import checkContractSize from "./checkContractSize";
const {ZERO_ADDRESS} = AddressUtils;

const {bigNumberify} = require('ethers/utils/bignumber');
const RLP = require('ethers/utils/rlp');
import {dappPath} from 'embark-utils';

const BLOCK_LIMIT = 100;

class EthereumBlockchainClient {

  constructor(embark) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.fs = embark.fs;
    this.contractsSubscriptions = [];
    this.contractsEvents = [];

    this.logFile = dappPath(".embark", "contractEvents.json");

    this.embark.registerActionForEvent("deployment:contract:deployed", this.addContractJSONToPipeline.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.determineArguments.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.doLinking.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', checkContractSize.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.determineAccounts.bind(this));
    this.events.request("blockchain:client:register", "ethereum", this.getClient.bind(this));
    this.events.request("deployment:deployer:register", "ethereum", this.deployer.bind(this));

    this.registerRequests();
    this.registerAPIRequests();
  }

  registerRequests() {
    const self = this;

    this.events.setCommandHandler("blockchain:reset", function (cb) {
      self.isWeb3Ready = false;
      self.initWeb3((err) => {
        if (err) {
          return cb(err);
        }
        self.events.emit('blockchain:reseted');
        cb();
      });
    });

    this.events.setCommandHandler("blockchain:get", function (cb) {
      cb(self.web3);
    });

    this.events.setCommandHandler("blockchain:defaultAccount:get", function (cb) {
      cb(self.defaultAccount());
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", function (account, cb) {
      self.setDefaultAccount(account);
      cb();
    });

    this.events.setCommandHandler("blockchain:getAccounts", function (cb) {
      self.getAccounts(cb);
    });

    this.events.setCommandHandler("blockchain:getBalance", function (address, cb) {
      self.getBalance(address, cb);
    });

    this.events.setCommandHandler("blockchain:block:byNumber", function (blockNumber, cb) {
      self.getBlock(blockNumber, cb);
    });

    this.events.setCommandHandler("blockchain:block:byHash", function (blockHash, cb) {
      self.getBlock(blockHash, cb);
    });

    this.events.setCommandHandler("blockchain:gasPrice", function (cb) {
      self.getGasPrice(cb);
    });

    this.events.setCommandHandler("blockchain:networkId", function (cb) {
      self.getNetworkId().then(cb);
    });

    this.events.setCommandHandler("blockchain:contract:create", function (params, cb) {
      cb(self.ContractObject(params));
    });
  }

  registerAPIRequests() {
    const self = this;

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/accounts',
      (req, res) => {
        self.getAccountsWithTransactionCount(res.send.bind(res));
      }
    );

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/accounts/:address',
      (req, res) => {
        self.getAccount(req.params.address, res.send.bind(res));
      }
    );

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/blocks',
      (req, res) => {
        const from = parseInt(req.query.from, 10);
        const limit = req.query.limit || 10;
        self.getBlocks(from, limit, !!req.query.txObjects, !!req.query.txReceipts, res.send.bind(res));
      }
    );

    this.embark.registerAPICall(
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

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/transactions',
      (req, res) => {
        let blockFrom = parseInt(req.query.blockFrom, 10);
        let blockLimit = req.query.blockLimit || 10;
        self.getTransactions(blockFrom, blockLimit, res.send.bind(res));
      }
    );

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/transactions/:hash',
      (req, res) => {
        self.getTransactionByHash(req.params.hash, (err, transaction) => {
          if (!err) return res.send(transaction);

          self.getTransactionByRawTransactionHash(req.params.hash, (err, transaction) => {
            if (err) return res.send({error: "Could not find or decode transaction hash"});
            res.send(transaction);
          });
        });
      }
    );

    this.embark.registerAPICall(
      'ws',
      '/embark-api/blockchain/blockHeader',
      (ws) => {
        self.events.on('block:header', (block) => {
          ws.send(JSON.stringify({block: block}), () => {});
        });
      }
    );

    this.embark.registerAPICall(
      'ws',
      '/embark-api/blockchain/contracts/event',
      (ws) => {
        this.events.on('blockchain:contracts:event', (data) => {
          ws.send(JSON.stringify(data), () => {});
        });
      }
    );

    this.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/contracts/events',
      (_req, res) => {
        res.send(JSON.stringify(this._getEvents()));
      }
    );

    this.embark.registerAPICall(
      'post',
      '/embark-api/messages/sign',
      (req, res) => {
        const signer = req.body.address;
        const message = req.body.message;
        this.web3.eth.sign(message, signer).then(signature => {
          res.send({signer, signature, message});
        }).catch(e => res.send({error: e.message}));
      }
    );

    this.embark.registerAPICall(
      'post',
      '/embark-api/messages/verify',
      (req, res) => {
        let signature;
        try {
          signature = JSON.parse(req.body.message);
        } catch (e) {
          return res.send({error: e.message});
        }

        this.web3.eth.personal.ecRecover(signature.message, signature.signature)
          .then(address => res.send({address}))
          .catch(e => res.send({error: e.message}));
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
        async.times(limit, function (n, eachCb) {
          self.web3.eth.getBlock(from - n, returnTransactionObjects, function (err, block) {
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
        .subscribe('pendingTransactions', function (error, transaction) {
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
    } catch (_error) {
      return {};
    }
  }

  getClient() {
    return {};
  }

  async deployer(contract, done) {
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    var web3 = new Web3(provider);
    // var web3 = new Web3("ws://localhost:8556")
    // web3.eth.getAccounts().then((accounts) => {
    let accounts = await web3.eth.getAccounts();
    let account = accounts[0];
    // let contractObject = this.blockchain.ContractObject({abi: contract.abiDefinition});
    let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.address);
    // let deployObject = this.blockchain.deployContractObject(contractObject, {arguments: contractParams, data: dataCode});
    let contractObject = contractObj.deploy({arguments: (contract.args || []), data: ("0x" + contract.code)});

    if (contract.gas === 'auto' || !contract.gas) {
      let gasValue = await contractObject.estimateGas();
      let increase_per = 1 + (Math.random() / 10.0);
      contract.gas = Math.floor(gasValue * increase_per);
    }

    if (!contract.gasPrice) {
      let gasPrice = await web3.eth.getGasPrice();
      contract.gasPrice = contract.gasPrice || gasPrice;
    }

    embarkJsUtils.secureSend(web3, contractObject, {
      from: account, gas: contract.gas
    }, true, (err, receipt) => {
      if (err) {
        return done(err);
      }
      contract.deployedAddress = receipt.contractAddress;
      contract.transactionHash = receipt.transactionHash;
      contract.log(`${contract.className.bold.cyan} ${__('deployed at').green} ${receipt.contractAddress.bold.cyan} ${__("using").green} ${receipt.gasUsed} ${__("gas").green} (txHash: ${receipt.transactionHash.bold.cyan})`);
      done(err, receipt);
    }, (hash) => {
    });
    // })
  }

  async doLinking(params, callback) {
    let contract = params.contract;

    if (!contract.linkReferences || !Object.keys(contract.linkReferences).length) {
      return callback(null, params);
    }
    let contractCode = contract.code;
    let offset = 0;

    async.eachLimit(contract.linkReferences, 1, (fileReference, eachCb1) => {
      async.eachOfLimit(fileReference, 1, (references, libName, eachCb2) => {
        let libContract = self.events.request2("contracts:contract", libName);

        async.eachLimit(references, 1, (reference, eachCb3) => {
          if (!libContract) {
            return eachCb3(new Error(__('{{contractName}} has a link to the library {{libraryName}}, but it was not found. Is it in your contract folder?'), {
              contractName: contract.className,
              libraryName: libName
            }));
          }

          let libAddress = libContract.deployedAddress;
          if (!libAddress) {
            return eachCb3(new Error(__("{{contractName}} needs {{libraryName}} but an address was not found, did you deploy it or configured an address?", {
              contractName: contract.className,
              libraryName: libName
            })));
          }

          libAddress = libAddress.substr(2).toLowerCase();

          // Multiplying by two because the original pos and length are in bytes, but we have an hex string
          contractCode = contractCode.substring(0, (reference.start * 2) + offset) + libAddress + contractCode.substring((reference.start * 2) + offset + (reference.length * 2));
          // Calculating an offset in case the length is at some point different than the address length
          offset += libAddress.length - (reference.length * 2);

          eachCb3();
        }, eachCb2);
      }, eachCb1);
    }, (err) => {
      contract.code = contractCode;
      callback(err, params);
    });
  }

  // TODO we can separate this into 3 separate methods, which will make it easier to test
  // determineArguments(suppliedArgs, contract, accounts, callback) {
  async determineArguments(params, callback) {
    const suppliedArgs = params.contract.args;
    const contract = params.contract;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

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
          return cb(__('No corresponding account at index %d', match[1]));
        }
        return cb(null, accounts[match[1]]);
      }
      let contractName = arg.substr(1);
      self.events.request('contracts:contract', contractName, (err, referedContract) => {
        // Because we're referring to a contract that is not being deployed (ie. an interface),
        // we still need to provide a valid address so that the ABI checker won't fail.
        cb(err, (referedContract.deployedAddress || ZERO_ADDRESS));
      });
    }

    function checkArgs(argus, cb) {
      async.map(argus, (arg, nextEachCb) => {
        if (Array.isArray(arg)) {
          return checkArgs(arg, nextEachCb);
        }
        if (arg[0] === "$") {
          return parseArg(arg, nextEachCb);
        }
        nextEachCb(null, arg);
      }, cb);
    }

    checkArgs(args, (err, realArgs) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = realArgs;
      callback(null, params);
    });
  }

  async determineAccounts(params, callback) {
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    let web3 = new Web3(provider)
    let accounts = await web3.eth.getAccounts();
    let deploymentAccount = accounts[0];
    let contract = params.contract;

    // applying deployer account configuration, if any
    if (typeof contract.fromIndex === 'number') {
      deploymentAccount = accounts[contract.fromIndex];
      if (deploymentAccount === undefined) {
        return callback(__("error deploying") + " " + contract.className + ": " + __("no account found at index") + " " + contract.fromIndex + __(" check the config"));
      }
    }
    if (typeof contract.from === 'string' && typeof contract.fromIndex !== 'undefined') {
      self.logger.warn(__('Both "from" and "fromIndex" are defined for contract') + ' "' + contract.className + '". ' + __('Using "from" as deployer account.'));
    }
    if (typeof contract.from === 'string') {
      deploymentAccount = contract.from;
    }

    contract.deploymentAccount = deploymentAccount;
    callback(null, params);
  }

  addContractJSONToPipeline(params, cb) {
    // TODO: check if this is correct json object to generate
    const contract = params.contract;

    this.events.request("pipeline:register", {
      path: [this.embark.config.embarkConfig.buildDir, 'contracts'],
      file: contract.className + '.json',
      format: 'json',
      content: contract
    }, cb);
  }

}

module.exports = EthereumBlockchainClient;
