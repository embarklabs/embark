/*globals describe, it, beforeEach*/
const {expect} = require('chai');
const sinon = require('sinon');
const Events = require('../../lib/core/events');
const Logger = require('embark-logger');
const transactionUtils = require('../../lib/utils/transactionUtils');
const ConsoleListener = require('../../lib/modules/console_listener');
const IPC = require('../../lib/core/ipc.js');
require('colors');

let events,
  logger,
  consoleListener,
  ipc,
  embark,
  loggerInfos = [],
  eventsEmitted = [],
  ipcRequest,
  contractsList;

function resetTest() {
  loggerInfos = [];
  eventsEmitted = [];
  ipcRequest = {
    type: 'contract-log',
    address: "0x12345",
    data: "0x6d4ce63c",
    transactionHash: "hash",
    blockNumber: "0x0",
    gasUsed: "0x0",
    status: "yay"
  };
  contractsList = [
    {
      abiDefinition: [
        {
          "constant": true,
          "inputs": [],
          "name": "storedData",
          "outputs": [
            {
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "x",
              "type": "uint256"
            }
          ],
          "name": "set",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "get",
          "outputs": [
            {
              "name": "retVal",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "name": "initialValue",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "constructor"
        }
      ],
      deployedAddress: "0x12345",
      className: "SimpleStorage",
      silent: true
    }
  ];

  events = new Events();
  logger = new Logger(events);
  ipc = new IPC({ipcRole: 'none'});
  embark = {
    events,
    logger,
    fs: {
      existsSync: () => { return false; },
      dappPath: () => { return "ok"; }
    },
    config: {
      contractsConfig: {}
    },
    registerAPICall: () => {}
  };

  // setup ConsoleListener
  consoleListener = new ConsoleListener(embark, {ipc});
  consoleListener.contractsDeployed = true;
  consoleListener.outputDone = true;

  sinon.stub(events, 'emit').callsFake((eventName, data) => {
    eventsEmitted.push({eventName, data});
    return true;
  });
  sinon.stub(logger, 'info').callsFake((args) => {
    loggerInfos.push(args);
  });
}

describe('Console Listener', function () {
  beforeEach('reset test', function (done) {
    resetTest();
    done();
  });

  describe('#listenForLogRequests', function () {
    it('should emit the correct contracts logs', function (done) {
      transactionUtils.getAddressToContract(contractsList, consoleListener.addressToContract);
      consoleListener._onIpcLogRequest(ipcRequest);

      const expectedContractLog = {
        address: "0x12345",
        blockNumber: 0,
        data: "0x6d4ce63c",
        functionName: "get",
        gasUsed: 0,
        name: "SimpleStorage",
        paramString: "",
        status: "yay",
        transactionHash: "hash",
        type: "contract-log"
      };
      const {name, functionName, paramString, transactionHash, gasUsed, blockNumber, status} = expectedContractLog;

      const contractLogEmitted = eventsEmitted.find(event => event.eventName === 'contracts:log');
      expect(contractLogEmitted).to.deep.equal({
        eventName: 'contracts:log',
        data: expectedContractLog
      });

      const blockchainTxLogEmitted = eventsEmitted.find(event => event.eventName === 'blockchain:tx');
      expect(blockchainTxLogEmitted).to.deep.equal({
        eventName: 'blockchain:tx',
        data: {
          name,
          functionName,
          paramString,
          transactionHash,
          gasUsed,
          blockNumber,
          status
        }
      });

      expect(loggerInfos[0]).to.be.equal(`Blockchain>`.underline + ` ${name}.${functionName}(${paramString})`.bold + ` | ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
      done();
    });

    it('should emit a log for a non-contract log', function (done) {
      ipcRequest.type = 'something-other-than-contract-log';
      transactionUtils.getAddressToContract(contractsList, consoleListener.addressToContract);
      consoleListener._onIpcLogRequest(ipcRequest);

      expect(loggerInfos[0]).to.be.equal(JSON.stringify(ipcRequest));
      done();
    });

    it('should emit an "unknown contract" log message', function (done) {
      consoleListener._onIpcLogRequest(ipcRequest);

      expect(loggerInfos[0]).to.be.equal(`Contract log for unknown contract: ${JSON.stringify(ipcRequest)}`);
      done();
    });
  });
});
