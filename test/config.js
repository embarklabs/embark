/*globals describe, it*/
let Config = require('../lib/core/config.js');
let Plugins = require('../lib/core/plugins.js');
let assert = require('assert');

describe('embark.Config', function() {
  let config = new Config({
    env: 'myenv',
    configDir: './test/test1/config/'
  });
  config.plugins = new Plugins({plugins: {}});

  describe('#loadBlockchainConfigFile', function() {
    it('should load blockchain config correctly', function() {
      config.loadBlockchainConfigFile();
      let expectedConfig = {
        "enabled": true,
        "networkType": "custom",
        "genesisBlock": "config/development/genesis.json",
        "datadir": ".embark/development/datadir",
        "mineWhenNeeded": true,
        "nodiscover": true,
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": "http://localhost:8000",
        "account": {
          "password": "config/development/password"
        }
      };

      assert.deepEqual(config.blockchainConfig, expectedConfig);
    });
  });

  describe('#loadContractsConfigFile', function() {
    it('should load contract config correctly', function() {
        config.loadContractsConfigFile();
        let expectedConfig = {
          "gas": "auto",
          "contracts": {
            "SimpleStorage": {
              "args": [
                100
              ],
              "gas": 123456
            },
            "Token": {
              "args": [
                200
              ]
            }
          }
        };

        assert.deepEqual(config.contractsConfig, expectedConfig);
    });
  });

});
