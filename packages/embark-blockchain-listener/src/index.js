import { dappPath } from 'embark-utils';
import { __ } from 'embark-i18n';
const async = require('async');
const DevTxs = require('./dev_txs');
const ProcessLogsApi = require('embark-process-logs-api');
const constants = require('embark-core/constants');

const PROCESS_NAME = 'blockchain';

/**
 * BlockchainListener has two functions:
 * 1. Register API endpoints (HTTP GET and WS) to retrieve blockchain logs
 *    when in standalone mode (ie `embark blockchain`).
 * 2. Listen to log events from the IPC connection (to `embark blockchain`)
 *    and ensure they are processed through the LogHandler.
 */
class BlockchainListener {

  /**
   * @param {Plugin} embark Embark module plugin object
   * @param {Object} options Options object containing:
   * - {Ipc} ipc IPC started by embark (in server role) used for communication
   *         with the standalone blockchain process.
   */
  constructor(embark, {ipc}) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.ipc = ipc;
    this.isDev = this.embark.config.env === constants.environments.development;
    this.devTxs = null;
    this.fs = this.embark.fs;
    this.proxyLogFile = dappPath(".embark", "proxyLogs.json");

    this.writeProxyLogFile = async.cargo((tasks, callback) => {
      const data = this._readProxyLogs();

      tasks.forEach(task => {
        data[new Date().getTime()] = task;
      });

      this.fs.writeJson(this.proxyLogFile, data, err => {
        if (err) {
          console.error(err);
        }
        callback();
      });
    });

    this.ipc.server.once('connect', () => {
      this.processLogsApi = new ProcessLogsApi({embark: this.embark, processName: PROCESS_NAME, silent: true});
      this._listenToBlockchainLogs();
    });
    if (this.ipc.isServer() && this.isDev) {
      this.events.request('blockchain:ready', () => {
        DevTxs.new({blockchainConfig: this.embark.config.blockchainConfig}).then(devTxs => {
          this.devTxs = devTxs;
          this.events.emit('blockchain:devtxs:ready');
        });
      });

      this._registerConsoleCommands();
      this._listenToIpcCommands();
    }
  }

  /**
   * Listens to log events emitted by the standalone blockchain and ensures
   * they are processed through the LogHandler.
   *
   * @return {void}
   */
  _listenToBlockchainLogs() {
    this.ipc.on('blockchain:log', ({logLevel, message}) => {
      this.processLogsApi.logHandler.handleLog({logLevel, message});
    });
  }

  _listenToIpcCommands() {
    this.ipc.on('blockchain:proxy:log', (log) => {
      this.logger.trace(log);
    });
    this.ipc.on('blockchain:proxy:logtofile', (log) => {
      this._saveProxyLog(log);
    });

    this.ipc.on('blockchain:devtxs:sendtx', () => {
      this._sendTx(() => {});
    });

  }

  _registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __('Toggles regular transactions used to prevent transactions from getting stuck when using Geth and Metamask'),
      matches: ['devtxs on', 'devtxs off', 'regularTxs on', 'regularTxs off'],
      usage: "devtxs on/off",
      process: (cmd, callback) => {
        if (cmd.startsWith('regularTxs')) {
          this.logger.info(__("Deprecation notice: The command 'regularTxs on/off' is now deprecated in favor of 'devtxs on/off' and will be removed in future versions."));
        }
        const enable = cmd.trim().endsWith('on');
        this.logger.info(`${enable ? 'Enabling' :  'Disabling'} regular transactions...`);
        if(enable) {
          return this._startRegularTxs(() => {
            const message = __('Regular transactions have been enabled');
            this.logger.info(message);
            callback(null, message);
          });
        }
        this._stopRegularTxs(() => {
          const message = __('Regular transactions have been disabled');
          this.logger.info(message);
          callback(null, message);
        });
      }
    });

    this.embark.registerConsoleCommand({
      description: __('Sends a transaction from default --dev account (generally used if txs are getting stuck in geth in development)'),
      matches: ['senddevtx'],
      process: (cmd, callback) => {
        this.logger.info(__('Sending a tx from the dev account...'));
        return this._sendTx((receipt) => {
          const message = __('Transaction sent. Receipt:') + `\n${JSON.stringify(receipt)}`;
          this.logger.debug(message);
          callback(null, message);
        });
      }
    });
  }

  _startRegularTxs(cb) {
    if(this.devTxs) {
      return this.devTxs.startRegularTxs(cb);
    }
    this.events.once('blockchain:devtxs:ready', () => { this.devTxs.startRegularTxs(cb); });
  }

  _stopRegularTxs(cb) {
    if(this.devTxs) {
      return this.devTxs.stopRegularTxs(cb);
    }
    this.events.once('blockchain:devtxs:ready', () => { this.devTxs.stopRegularTxs(cb); });
  }

  _sendTx(cb) {
    if(this.devTxs) {
      return this.devTxs.sendTx(cb);
    }
    this.events.once('blockchain:devtxs:ready', () => { this.devTxs.sendTx(cb); });
  }

  _saveProxyLog(log) {
    this.writeProxyLogFile.push(log);
  }

  _readProxyLogs() {
    this.fs.ensureFileSync(this.proxyLogFile);
    try {
      return JSON.parse(this.fs.readFileSync(this.proxyLogFile));
    } catch (_error) {
      return {};
    }
  }
}

module.exports = BlockchainListener;
