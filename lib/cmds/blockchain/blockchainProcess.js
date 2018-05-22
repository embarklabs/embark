const ProcessWrapper = require('../../process/processWrapper');
const BlockchainClient = require('./blockchain');
const i18n = require('../../i18n/i18n.js');

class BlockchainProcess extends ProcessWrapper {
  constructor(options) {
    super();
    this.blockchainConfig = options.blockchainConfig;
    this.client = options.client;
    this.env = options.env;
    this.isDev = options.isDev;

    i18n.setOrDetectLocale(options.locale);

    this.blockchainConfig.verbosity = 0;
    this.blockchain = BlockchainClient(this.blockchainConfig, this.client, this.env, this.isDev);
    this.blockchain.run();
  }
}

process.on('message', (msg) => {
  if (msg.action === 'init') {
    const blockchainProcess = new BlockchainProcess(msg.options);
    return process.send({result: 'initiated'});
  }
});
