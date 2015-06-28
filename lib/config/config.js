var readYaml = require('read-yaml');

BlockchainConfig = require('./blockchain.js');
ContractsConfig = require('./contracts.js');

Config = {
  Blockchain: BlockchainConfig,
  Contracts: ContractsConfig
}

module.exports = Config

