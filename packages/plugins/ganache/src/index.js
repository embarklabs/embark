class Ganache {
  constructor(embark) {
    embark.events.request('blockchain:vm:register', 'ganache-cli', () => {
      const ganache = require('ganache-cli');
      const blockchainConfig = embark.config.blockchainConfig;

      return ganache.provider({
        // Default to 8000000, which is the server default
        // Somehow, the provider default is 6721975
        gasLimit: blockchainConfig.targetGasLimit || '0x7A1200',
        blockTime: blockchainConfig.simulatorBlocktime,
        network_id:  blockchainConfig.networkId
      });
    });
  }
}

module.exports = Ganache;
