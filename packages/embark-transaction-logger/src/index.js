const async = require('async');
import {__} from 'embark-i18n';

const {blockchain: blockchainConstants} = require('embark-core/constants');
import {dappPath, getAddressToContract, getTransactionParams, hexToNumber} from 'embark-utils';


const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

const LISTENED_METHODS = [
  blockchainConstants.transactionMethods.eth_call,
  blockchainConstants.transactionMethods.eth_getTransactionReceipt,
  blockchainConstants.transactionMethods.eth_sendTransaction,
  blockchainConstants.transactionMethods.eth_sendRawTransaction
];

class TransactionLogger {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.addressToContract = [];
    this.contractsConfig = embark.config.contractsConfig;
    this.contractsDeployed = false;
    this.outputDone = false;
    this.logFile = dappPath(".embark", "contractLogs.json");
    this.transactions = {};

    this._listenForLogRequests();
    this._registerAPI();

    this.events.on("contracts:log", this._saveLog.bind(this));
    this.events.on('outputDone', () => {
      this.outputDone = true;
    });
    this.events.on("contractsDeployed", () => {
      this.contractsDeployed = true;

      this._getContractsList((contractsList) => {
        this.addressToContract = getAddressToContract(contractsList, this.addressToContract);
      });
    });

    this.writeLogFile = async.cargo((tasks, callback) => {
      const data = this._readLogs();

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
  }

  _getContractsList(callback) {
    this.events.request("contracts:list", (err, contractsList) => {
      if (err) {
        this.logger.error(__("no contracts found"));
        return callback();
      }
      callback(contractsList);
    });
  }

  _listenForLogRequests() {
    this.events.on('deploy:contract:receipt', receipt => {
      this.events.emit('contracts:log', {
        name: receipt.className,
        functionName: 'constructor',
        paramString: '',
        address: receipt.contractAddress,
        status: receipt.status ? '0x1' : '0x0',
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash
      });
    });

    this.events.on('blockchain:proxy:response', this._onLogRequest.bind(this));
  }

  _onLogRequest(args) {
    const method = args.reqData.method;
    if (!this.contractsDeployed || !LISTENED_METHODS.includes(method)) {
      return;
    }

    if (method === blockchainConstants.transactionMethods.eth_sendTransaction) {
      // We just gather data and wait for the receipt
      this.transactions[args.respData.result] = {
        address: args.reqData.params[0].to,
        data: args.reqData.params[0].data,
        txHash: args.respData.result
      };
      return;
    } else if (method === blockchainConstants.transactionMethods.eth_sendRawTransaction) {
      const rawData = Buffer.from(ethUtil.stripHexPrefix(args.reqData.params[0]), 'hex');
      const tx = new Transaction(rawData, 'hex');
      this.transactions[args.respData.result] = {
        address: '0x' + tx.to.toString('hex'),
        data: '0x' + tx.data.toString('hex')
      };
      return;
    }

    let dataObject;
    if (method === blockchainConstants.transactionMethods.eth_getTransactionReceipt) {
      dataObject = args.respData.result;
      if (!dataObject) {
        return;
      }
      if (this.transactions[args.respData.result.transactionHash]) {
        // This is the normal case. If we don't get here, it's because we missed a TX
        dataObject = Object.assign(dataObject, this.transactions[args.respData.result.transactionHash]);
        delete this.transactions[args.respData.result.transactionHash]; // No longer needed
      }
    } else {
      dataObject = args.reqData.params[0];
    }
    const {to: address, data} = dataObject;
    if (!address) {
      // It's a deployment
      return;
    }
    const contract = this.addressToContract[address];

    if (!contract) {
      this.logger.info(`Contract log for unknown contract: ${JSON.stringify(args)}`);
      return this._getContractsList((contractsList) => {
        this.addressToContract = getAddressToContract(contractsList, this.addressToContract);
      });
    }

    const {name, silent} = contract;
    if (silent && !this.outputDone) {
      return;
    }

    let functionName, paramString;
    if (!data) {
      // We missed the TX
      functionName = 'unknown';
      paramString = 'unknown';
    } else {
      const txParams = getTransactionParams(contract, data);
      functionName = txParams.functionName;
      paramString = txParams.paramString;
    }

    if (method === blockchainConstants.transactionMethods.eth_call) {
      const log = Object.assign({}, args, {name, functionName, paramString});
      log.status = '0x1';
      return this.events.emit('contracts:log', log);
    }

    let {transactionHash, blockNumber, gasUsed, status} = args.respData.result;
    gasUsed = hexToNumber(gasUsed);
    blockNumber = hexToNumber(blockNumber);
    const log = Object.assign({}, args, {name, functionName, paramString, gasUsed, blockNumber});

    this.events.emit('contracts:log', log);
    this.logger.info(`Blockchain>`.underline + ` ${name}.${functionName}(${paramString})`.bold + ` | ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
    this.events.emit('blockchain:tx', {
      name: name,
      functionName: functionName,
      paramString: paramString,
      transactionHash: transactionHash,
      gasUsed: gasUsed,
      blockNumber: blockNumber,
      status: status
    });
  }

  _registerAPI() {
    const apiRoute = '/embark-api/contracts/logs';
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        // FIXME this will be broken probably in the cokcpit because we don't send the same data as before
        this.events.on('contracts:log', function(log) {
          ws.send(JSON.stringify(log), () => {
          });
        });
      }
    );

    this.embark.registerAPICall(
      'get',
      apiRoute,
      (req, res) => {
        res.send(JSON.stringify(this._getLogs()));
      }
    );
  }

  _getLogs() {
    const data = this._readLogs();
    return Object.values(data).reverse();
  }

  _saveLog(log) {
    this.writeLogFile.push(log);
  }

  _readLogs() {
    this.fs.ensureFileSync(this.logFile);
    try {
      return JSON.parse(this.fs.readFileSync(this.logFile));
    } catch (_error) {
      return {};
    }
  }
}

module.exports = TransactionLogger;
