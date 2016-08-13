var readYaml = require('read-yaml');

BlockchainConfig = require('./blockchain.js');
ContractsConfig = require('./contracts.js');

config = {
  Blockchain: BlockchainConfig,
  Contracts: ContractsConfig
}

module.exports = config

