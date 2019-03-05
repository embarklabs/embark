const async = require('async');
const utils = require('../../utils/utils.js');
const {getAddressToContract, getTransactionParams} = require('../../utils/transactionUtils');

class ConsoleListener {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.ipc = options.ipc;
    this.events = embark.events;
    this.fs = embark.fs;
    this.addressToContract = [];
    this.contractsConfig = embark.config.contractsConfig;
    this.contractsDeployed = false;
    this.outputDone = false;
    this.logFile = this.fs.dappPath(".embark", "contractLogs.json");

    if (this.ipc.ipcRole === 'server') {
      this._listenForLogRequests();
    }
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

    this.ipc.on('log', (request) => {
      this._onIpcLogRequest(request);
    });
  }

  _onIpcLogRequest(request) {
    if (request.type !== 'contract-log') {
      return this.logger.info(JSON.stringify(request));
    }

    if (!this.contractsDeployed) return;

    const {address, data} = request;
    const contract = this.addressToContract[address];

    if (!contract) {
      this.logger.info(`Contract log for unknown contract: ${JSON.stringify(request)}`);
      return this._getContractsList((contractsList) => {
        this.addressToContract = getAddressToContract(contractsList, this.addressToContract);
      });
    }

    const {name, silent} = contract;
    if (silent && !this.outputDone) {
      return;
    }

    const {functionName, paramString} = getTransactionParams(contract, data);

    if (request.kind === 'call') {
      const log = Object.assign({}, request, {name, functionName, paramString});
      log.status = '0x1';
      return this.events.emit('contracts:log', log);
    }

    let {transactionHash, blockNumber, gasUsed, status} = request;
    gasUsed = utils.hexToNumber(gasUsed);
    blockNumber = utils.hexToNumber(blockNumber);
    const log = Object.assign({}, request, {name, functionName, paramString, gasUsed, blockNumber});

    this.events.emit('contracts:log', log);
    this.logger.info(`Blockchain>`.underline + ` ${name}.${functionName}(${paramString})`.bold + ` | ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
    this.events.emit('blockchain:tx', {name: name, functionName: functionName, paramString: paramString, transactionHash: transactionHash, gasUsed: gasUsed, blockNumber: blockNumber, status: status});
  }

  _registerAPI() {
    const apiRoute = '/embark-api/contracts/logs';
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        this.events.on('contracts:log', function (log) {
          ws.send(JSON.stringify(log), () => {});
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

module.exports = ConsoleListener;
