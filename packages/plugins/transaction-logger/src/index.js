import { __ } from 'embark-i18n';
const Web3 = require('web3');
const util = require('util');

const { blockchain: blockchainConstants } = require('embark-core/constants');
import { dappPath, hexToNumber, getAppendLogFileCargo, readAppendedLogs } from 'embark-utils';
import { getAddressToContract, getTransactionParams } from './transactionUtils';
export { getAddressToContract, getTransactionParams };

const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

const LISTENED_METHODS = [
  blockchainConstants.transactionMethods.eth_call,
  blockchainConstants.transactionMethods.eth_getTransactionReceipt,
  blockchainConstants.transactionMethods.eth_sendTransaction,
  blockchainConstants.transactionMethods.eth_sendRawTransaction
];

export default class TransactionLogger {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.addressToContract = [];
    this.contractsConfig = embark.config.contractsConfig;
    this.contractsDeployed = false;
    this.outputDone = false;
    this.logFile = dappPath(".embark", "contractLogs.json.txt");
    this.transactions = {};

    this._listenForLogRequests();
    this._registerAPI();

    this.events.on("contracts:log", this._saveLog.bind(this));
    this.events.on('outputDone', () => {
      this.outputDone = true;
    });

    this.embark.registerActionForEvent("deployment:deployContracts:afterAll", { priority: 38 }, (params, cb) => {
      this.contractsDeployed = true;
      this._getContractsList((contractsList) => {
        this.addressToContract = getAddressToContract(contractsList, this.addressToContract);
        cb(null, params);
      });
    });

    this.writeLogFile = getAppendLogFileCargo(this.logFile, this.logger);
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

  get web3Accounts() {
    return (async () => {
      if (!this._web3Accounts) {
        const web3 = await this.web3;
        this._web3Accounts = await web3.eth.getAccounts();
      }
      return this._web3Accounts;
    })();
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

  async _onLogRequest(args) {
    /*eslint complexity: ["error", 22]*/
    const method = args.request.method;
    if (!this.contractsDeployed || !LISTENED_METHODS.includes(method)) {
      return;
    }

    if (method === blockchainConstants.transactionMethods.eth_sendTransaction) {
      // We just gather data and wait for the receipt
      this.transactions[args.response.result] = {
        address: args.request.params[0].to,
        data: args.request.params[0].data,
        value: args.request.params[0].value,
        txHash: args.response.result
      };
      return;
    } else if (method === blockchainConstants.transactionMethods.eth_sendRawTransaction) {
      const rawData = Buffer.from(ethUtil.stripHexPrefix(args.request.params[0]), 'hex');
      const tx = new Transaction(rawData, 'hex');
      this.transactions[args.response.result] = {
        address: '0x' + tx.to.toString('hex'),
        data: '0x' + tx.data.toString('hex')
      };
      return;
    }

    let dataObject;
    if (method === blockchainConstants.transactionMethods.eth_getTransactionReceipt) {
      dataObject = args.response.result;
      if (!dataObject) {
        return;
      }
      if (this.transactions[args.response.result.transactionHash]) {
        // This is the normal case. If we don't get here, it's because we missed a TX
        dataObject = Object.assign(dataObject, this.transactions[args.response.result.transactionHash]);
        delete this.transactions[args.response.result.transactionHash]; // No longer needed
      } else {
        // Was not a eth_getTransactionReceipt in the context of a transaction
        return;
      }
    } else {
      dataObject = args.request.params[0];
    }
    const { to: address, data } = dataObject;
    if (!address) {
      // It's a deployment
      return;
    }

    const accounts = await this.web3Accounts;

    if (accounts.map(account => account.toLowerCase()).includes(address.toLowerCase())) {
      const web3 = await this.web3;
      const value = dataObject.value ? web3.utils.fromWei(web3.utils.hexToNumberString(dataObject.value)) : 0;
      return this.logger.info(`Blockchain>`.underline + ` transferring ${value} ETH from ${dataObject.from} to ${address}`.bold);
    }

    const contract = this.addressToContract[address];
    if (!contract) {
      this.logger.debug(`Contract log for unknown contract: ${util.inspect(args)}`);
      return this._getContractsList((contractsList) => {
        this.addressToContract = getAddressToContract(contractsList, this.addressToContract);
      });
    }

    const { name, silent } = contract;
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
      const log = Object.assign({}, args, { name, functionName, paramString });
      log.status = '0x1';
      return this.events.emit('contracts:log', log);
    }

    let { transactionHash, blockNumber, gasUsed, status } = args.response.result;
    let reason;
    if (status !== '0x0' && status !== '0x1') {
      status = !status ? '0x0' : '0x1';
    }

    if (status === '0x0') {
      const web3 = await this.web3;
      const tx = await web3.eth.getTransaction(transactionHash);
      if (tx) {
        const code = await web3.eth.call(tx, tx.blockNumber);
        // Convert to Ascii and remove the useless bytes around the revert message
        reason = web3.utils.hexToAscii('0x' + code.substring(138)).toString().replace(/[^\x20-\x7E]/g, '');
      }
    }

    gasUsed = hexToNumber(gasUsed);
    blockNumber = hexToNumber(blockNumber);
    const log = Object.assign({}, args, { name, functionName, paramString, gasUsed, blockNumber, reason, status, transactionHash });

    this.events.emit('contracts:log', log);
    this.logger.info(`Blockchain>`.underline + ` ${name}.${functionName}(${paramString})`.bold + ` | ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}${reason ? ` | reason: "${reason}"` : ''}`);
    this.events.emit('blockchain:tx', {
      name,
      functionName,
      paramString,
      transactionHash,
      gasUsed,
      blockNumber,
      status,
      reason
    });
  }

  _registerAPI() {
    const apiRoute = '/embark-api/contracts/logs';
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        this.events.on('contracts:log', (log) => {
          ws.send(JSON.stringify(log), () => {});
        });
      }
    );

    this.embark.registerAPICall(
      'get',
      apiRoute,
      async (req, res) => {
        res.send(await this._readLogs(true));
      }
    );
  }

  _saveLog(log) {
    this.writeLogFile.push(log);
  }

  async _readLogs(asString = false) {
    try {
      return readAppendedLogs(this.logFile, asString);
    } catch (e) {
      this.logger.error('Error reading contract log file', e.message);
      this.logger.trace(e.trace);
      return asString ? '[]' : [];
    }
  }
}
