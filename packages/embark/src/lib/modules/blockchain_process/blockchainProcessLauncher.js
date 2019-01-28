const ProcessLauncher = require('../../core/processes/processLauncher');
const utils = require('../../utils/utils.js');
const constants = require('../../constants');

class BlockchainProcessLauncher {

  constructor (options) {
    this.events = options.events;
    this.logger = options.logger;
    this.normalizeInput = options.normalizeInput;
    this.blockchainConfig = options.blockchainConfig;
    this.locale = options.locale;
    this.isDev = options.isDev;
    this.client = options.client;
    this.embark = options.embark;
  }

  processEnded(code) {
    this.logger.error(__('Blockchain process ended before the end of this process. Try running blockchain in a separate process using `$ embark blockchain`. Code: %s', code));
  }

  startBlockchainNode() {
    this.logger.info(__('Starting Blockchain node in another process').cyan);

    this.blockchainProcess = new ProcessLauncher({
      name: 'blockchain',
      modulePath: utils.joinPath(__dirname, './blockchainProcess.js'),
      logger: this.logger,
      events: this.events,
      embark: this.embark,
      silent: this.logger.logLevel !== 'trace',
      exitCallback: this.processEnded.bind(this)
    });
    this.blockchainProcess.send({
      action: constants.blockchain.init, options: {
        blockchainConfig: this.blockchainConfig,
        client: this.client,
        env: this.env,
        isDev: this.isDev,
        locale: this.locale,
        certOptions: this.embark.config.webServerConfig.certOptions,
        events: this.events
      }
    });

    this.blockchainProcess.once('result', constants.blockchain.blockchainReady, () => {
      this.logger.info(__('Blockchain node is ready').cyan);
      this.events.emit(constants.blockchain.blockchainReady);
    });

    this.blockchainProcess.once('result', constants.blockchain.blockchainExit, () => {
      // tell everyone that our blockchain process (ie geth) died
      this.events.emit(constants.blockchain.blockchainExit);

      // then kill off the blockchain process
      this.blockchainProcess.kill();
    });

    this.events.on('logs:ethereum:enable', () => {
      this.blockchainProcess.silent = false;
    });

    this.events.on('logs:ethereum:disable', () => {
      this.blockchainProcess.silent = true;
    });
    
    this.events.on('regularTxs:start', () => {
      this.blockchainProcess.send({action: constants.blockchain.startRegularTxs});
    });

    this.events.on('regularTxs:stop', () => {
      this.blockchainProcess.send({action: constants.blockchain.stopRegularTxs});
    });

    this.events.on('exit', () => {
      this.blockchainProcess.send('exit');
    });
  }

}

module.exports = BlockchainProcessLauncher;
