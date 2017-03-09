/*globals describe, it*/
var Config = require('../lib/core/config.js');
var Plugins = require('../lib/core/plugins.js');
var assert = require('assert');
var fs = require('fs');

describe('embark.Config', function() {
  var config = new Config({
    env: 'myenv',
    configDir: './test/test1/config/'
  });
  config.plugins = new Plugins({plugins: {}});

  describe('#loadBlockchainConfigFile', function() {
    it('should load blockchain config correctly', function() {
      config.loadBlockchainConfigFile();
      var expectedConfig = {
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
        var expectedConfig = {
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
