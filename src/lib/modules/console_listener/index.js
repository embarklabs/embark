const async = require('async');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs');

class ConsoleListener {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.ipc = options.ipc;
    this.events = embark.events;
    this.addressToContract = [];
    this.contractsConfig = embark.config.contractsConfig;
    this.contractsDeployed = false;
    this.outputDone = false;
    this.logFile = fs.dappPath(".embark", "contractLogs.json");

    this._listenForLogRequests();
    this._registerAPI();
    
    this.events.on("contracts:log", this._saveLog.bind(this));
    this.events.on('outputDone', () => {
      this.outputDone = true;
    });
    this.events.on("contractsDeployed", () => {
      this.contractsDeployed = true;
      this._updateContractList();
    });

    this.writeLogFile = async.cargo((tasks, callback) => {
      const data = this._readLogs();

      tasks.forEach(task => {
        data[new Date().getTime()] = task;
      });

      fs.writeJson(this.logFile, data, err => {
        if (err) {
          console.error(err);
        }
        callback();
      });
    });
  }

  _updateContractList() {
    this.events.request("contracts:list", (_err, contractsList) => {
      if (_err) {
        this.logger.error(__("no contracts found"));
        return;
      }
      contractsList.forEach(contract => {
        if (!contract.deployedAddress) return;

        let address = contract.deployedAddress.toLowerCase();
        if (!this.addressToContract[address]) {
          let funcSignatures = {};
          contract.abiDefinition
            .filter(func => func.type === "function")
            .map(func => {
              const name = func.name +
                '(' +
                (func.inputs ? func.inputs.map(input => input.type).join(',') : '') +
                ')';
              funcSignatures[utils.sha3(name).substring(0, 10)] = {
                name,
                abi: func,
                functionName: func.name
              };
            });

          this.addressToContract[address] = {
            name: contract.className,
            functions: funcSignatures,
            silent: contract.silent
          };
        }
      });
    });
  }

  _listenForLogRequests() {
    if (this.ipc.ipcRole !== 'server') return;
    this.ipc.on('log', (request) => {
      if (request.type !== 'contract-log') {
        return this.logger.info(JSON.stringify(request));
      }

      if (!this.contractsDeployed) return;

      let {address, data, transactionHash, blockNumber, gasUsed, status} = request;
      const contract = this.addressToContract[address];

      if (!contract) {
        this._updateContractList();
        return;
      }

      const {name, silent} = contract;
      if (silent && !this.outputDone) {
        return;
      }

      const func = contract.functions[data.substring(0, 10)];
      const functionName = func.functionName;

      const decodedParameters = utils.decodeParams(func.abi.inputs, data.substring(10));
      let paramString = "";
      if (func.abi.inputs) {
        func.abi.inputs.forEach((input) => {
          let quote = input.type.indexOf("int") === -1 ? '"' : '';
          paramString += quote + decodedParameters[input.name] + quote + ", ";
        });
        paramString = paramString.substring(0, paramString.length - 2);
      }

      gasUsed = utils.hexToNumber(gasUsed);
      blockNumber = utils.hexToNumber(blockNumber);

      const log = Object.assign({}, request, {name, functionName, paramString, gasUsed, blockNumber});
      this.events.emit('contracts:log', log);

      this.logger.info(`Blockchain>`.underline + ` ${name}.${functionName}(${paramString})`.bold + ` | ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
      this.events.emit('blockchain:tx', { name: name, functionName: functionName, paramString: paramString, transactionHash: transactionHash, gasUsed: gasUsed, blockNumber: blockNumber, status: status });
    });
  }

  _registerAPI() {
    const apiRoute = '/embark-api/contracts/logs';
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        this.events.on('contracts:log', function(log) {
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
    fs.ensureFileSync(this.logFile);
    try {
      return JSON.parse(fs.readFileSync(this.logFile));
    } catch(_error) {
      return {};
    }
  }
}

module.exports = ConsoleListener;
