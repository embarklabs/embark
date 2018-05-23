const ProcessLauncher = require('../process/processLauncher');
const utils = require('../utils/utils.js');
const constants = require('../constants');

class BlockchainProcessLauncher {

  constructor (options) {
    this.events = options.events;
    this.logger = options.logger;
    this.normalizeInput = options.normalizeInput;
    this.blockchainConfig = options.blockchainConfig;
    this.locale = options.locale;
  }

  startBlockchainNode() {
    this.logger.info('Starting Blockchain node in another process'.cyan);

    this.blockchainProcess = new ProcessLauncher({
      modulePath: utils.joinPath(__dirname, '../cmds/blockchain/blockchainProcess.js'),
      logger: this.logger,
      events: this.events,
      normalizeInput: this.normalizeInput,
      //silent: true
      silent: false
    });
    this.blockchainProcess.send({
      action: constants.blockchain.init, options: {
        blockchainConfig: this.blockchainConfig,
        //client: this.client,
        // TODO: assume for now it's geth
        client: 'geth',
        env: this.env,
        //isDev: this.isDev,
        // TODO: assume for now it's true
        isDev: true,
        locale: this.locale
      }
    });

    this.blockchainProcess.once('result', constants.blockchain.blockchainReady, () => {
      this.logger.info('Blockchain node is ready'.cyan);
      this.events.emit(constants.blockchain.blockchainReady);
    });
  }

}

module.exports = BlockchainProcessLauncher;
