import * as i18n from 'embark-i18n';
import { ProcessWrapper } from 'embark-core';
const constants = require('embark-core/constants');
import { BlockchainClient } from './blockchain';

let blockchainProcess;

class BlockchainProcess extends ProcessWrapper {
  constructor(options) {
    super();
    this.blockchainConfig = options.blockchainConfig;
    this.communicationConfig = options.communicationConfig;
    this.client = options.client;
    this.env = options.env;
    this.isDev = options.isDev;
    this.certOptions = options.certOptions;

    i18n.setOrDetectLocale(options.locale);

    this.blockchainConfig.silent = true;
    this.blockchain = new BlockchainClient(
      this.blockchainConfig,
      {
        clientName: this.client,
        env: this.env,
        certOptions: this.certOptions,
        onReadyCallback: this.blockchainReady.bind(this),
        onExitCallback: this.blockchainExit.bind(this),
        logger: console
      },
      this.communicationConfig
    );

    this.blockchain.run();
  }

  blockchainReady() {
    blockchainProcess.send({result: constants.blockchain.blockchainReady});
  }

  blockchainExit() {
    // tell our parent process that ethereum client has exited
    blockchainProcess.send({result: constants.blockchain.blockchainExit});
  }

  kill() {
    this.blockchain.kill();
  }
}

process.on('message', (msg) => {
  if (msg === 'exit') {
    return blockchainProcess.kill();
  }
  if (msg.action === constants.blockchain.init) {
    blockchainProcess = new BlockchainProcess(msg.options);
    return blockchainProcess.send({result: constants.blockchain.initiated});
  }
});
