import { __ } from 'embark-i18n';
import { ProcessLauncher } from 'embark-core';
import { joinPath } from 'embark-utils';
const constants = require('embark-core/constants');

export class BlockchainProcessLauncher {

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

  startBlockchainNode(readyCb) {
    this.logger.info(__('Starting Blockchain node in another process').cyan);

    this.blockchainProcess = new ProcessLauncher({
      name: 'blockchain',
      modulePath: joinPath(__dirname, './blockchainProcess.js'),
      logger: this.logger,
      events: this.events,
      silent: this.logger.logLevel !== 'trace',
      exitCallback: this.processEnded.bind(this),
      embark: this.embark
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
      readyCb();
      // this.events.emit(constants.blockchain.blockchainReady);
    });

    this.blockchainProcess.once('result', constants.blockchain.blockchainExit, () => {
      // tell everyone that our blockchain process (ie geth) died
      this.events.emit(constants.blockchain.blockchainExit);

      // then kill off the blockchain process
      this.blockchainProcess.kill();
    });


    this.events.setCommandHandler('logs:ethereum:enable', () => {
      this.blockchainProcess.setSilent(false);
    });

    this.events.setCommandHandler('logs:ethereum:disable', () => {
      this.blockchainProcess.setSilent(true);
    });

    this.events.on('exit', () => {
      this.blockchainProcess.send('exit');
    });
  }

  stopBlockchainNode(cb) {
    if(this.blockchainProcess) {
      this.events.once(constants.blockchain.blockchainExit, cb);
      this.blockchainProcess.exitCallback = () => {}; // don't show error message as the process was killed on purpose
      this.blockchainProcess.send('exit');
    }
  }

}

