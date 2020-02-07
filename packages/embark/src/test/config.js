/*global describe, it*/
import { Config, Events, Plugins, TestLogger } from 'embark-core';
const { dappPath } = require('embark-utils');
const assert = require('assert');

describe('embark.Config', function () {
  let config = new Config({
    env: 'myenv',
    configDir: 'test1/config/',
    events: new Events(),
    embarkConfig: {
      versions: {}
    }
  });
  config.plugins = new Plugins({plugins: {}});
  config.logger = new TestLogger({});

  describe('#loadBlockchainConfigFile', function () {
    it('should load blockchain config correctly', function () {
      config.loadBlockchainConfigFile();
      let expectedConfig = {
        "enabled": true,
        "client": "ganache-cli",
        "proxy": true,
        "clientConfig": {
          "miningMode": "dev"
        },
        "datadir": ".embark/myenv/datadir",
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": {
          "auto": true,
          "additionalCors": []
        },
        "wsRPC": true,
        "wsOrigins": {
          "auto": true,
          "additionalCors": []
        },
        "wsHost": "localhost",
        "wsPort": 8546,
        "networkType": "custom",
        "isDev": false,
        "mineWhenNeeded": true,
        "nodiscover": true,
        "maxpeers": 0,
        "targetGasLimit": 8000000,
        "simulatorBlocktime": 0,
        "miningMode": "auto",
        "endpoint": "ws://localhost:8546",
        "isAutoEndpoint": true
      };

      assert.deepStrictEqual(config.blockchainConfig, expectedConfig);
    });

    it('should convert Ether units', function () {
      let expectedConfig = {
        "enabled": true,
        "client": "ganache-cli",
        "proxy": true,
        "clientConfig": {
          "miningMode": "dev"
        },
        "datadir": ".embark/unitenv/datadir",
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": {
          "auto": true,
          "additionalCors": []
        },
        "wsRPC": true,
        "wsOrigins": {
          "auto": true,
          "additionalCors": []
        },
        "wsHost": "localhost",
        "wsPort": 8546,
        "networkType": "custom",
        "isDev": false,
        "mineWhenNeeded": true,
        "nodiscover": true,
        "maxpeers": 0,
        "simulatorBlocktime": 0,
        "miningMode": "auto",
        "gasPrice": "8000000",
        "targetGasLimit": "300000",
        "accounts": [
          {
            "password": "config/development/password",
            "balance": "3000000000000000000"
          }
        ],
        "endpoint": "ws://localhost:8546",
        "isAutoEndpoint": true
      };

      let config = new Config({
        env: 'unitenv',
        configDir: 'test1/config/',
        events: new Events()
      });
      config.plugins = new Plugins({plugins: {}});
      config.logger = new TestLogger({});
      config.loadBlockchainConfigFile();

      assert.deepStrictEqual(config.blockchainConfig, expectedConfig);
    });

    it('should accept unitless gas values', function () {
      let expectedConfig = {
        "enabled": true,
        "client": "ganache-cli",
        "proxy": true,
        "clientConfig": {
          "miningMode": "dev"
        },
        "datadir": ".embark/unitlessenv/datadir",
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": {
          "auto": true,
          "additionalCors": []
        },
        "wsRPC": true,
        "wsOrigins": {
          "auto": true,
          "additionalCors": []
        },
        "wsHost": "localhost",
        "wsPort": 8546,
        "networkType": "custom",
        "isDev": false,
        "mineWhenNeeded": true,
        "nodiscover": true,
        "maxpeers": 0,
        "simulatorBlocktime": 0,
        "miningMode": "auto",
        "gasPrice": "8000000",
        "targetGasLimit": "20000000",
        "accounts": [
          {
            "password": "config/development/password",
            "balance": "3000000000000000000"
          }
        ],
        "endpoint": "ws://localhost:8546",
        "isAutoEndpoint": true
      };

      let config = new Config({
        env: 'unitlessenv',
        configDir: 'test1/config/',
        events: new Events()
      });
      config.plugins = new Plugins({plugins: {}});
      config.logger = new TestLogger({});
      config.loadBlockchainConfigFile();

      assert.deepStrictEqual(config.blockchainConfig, expectedConfig);
    });

    it('should use the specified endpoint', () => {
      let expectedConfig = {
        "enabled": true,
        "client": "ganache-cli",
        "proxy": true,
        "clientConfig": {
          "miningMode": "dev"
        },
        "datadir": ".embark/extNetwork/datadir",
        "rpcHost": "mynetwork.com",
        "rpcPort": false,
        "rpcCorsDomain": {
          "auto": true,
          "additionalCors": []
        },
        "wsRPC": false,
        "wsOrigins": {
          "auto": true,
          "additionalCors": []
        },
        "wsHost": "localhost",
        "wsPort": 8546,
        "networkType": "custom",
        "isDev": false,
        "nodiscover": true,
        "maxpeers": 0,
        "simulatorBlocktime": 0,
        "targetGasLimit": 8000000,
        "endpoint": "http://mynetwork.com"
      };

      let config = new Config({
        env: 'extNetwork',
        configDir: 'test1/config/',
        events: new Events(),
        logger: new TestLogger({}),
        plugins: new Plugins({plugins: {}})
      });
      config.loadBlockchainConfigFile();

      assert.deepStrictEqual(config.blockchainConfig, expectedConfig);
    });
  });

  describe('#loadContractsConfigFile', function () {
    it('should load contract config correctly', function () {
      config.loadContractsConfigFile();
      let expectedConfig = {
        versions: {solc: '0.6.1'},
        dappConnection: ['$WEB3', 'ws://localhost:8546', 'localhost:8545'],
        dappAutoEnable: true,
        "gas": "400000",
        "library": "embarkjs",
        "strategy": "implicit",
        "contracts": {
          "SimpleStorage": {
            "args": [100],
            "gas": "123000",
            "gasPrice": "1000"
          },
          "Token": {
            "args": [200]
          }
        }
      };

      assert.deepStrictEqual(config.contractsConfig, expectedConfig);
    });

    it('should replace occurrences of `0x0` with full zero addresses', () => {
      let expectedConfig = {
        versions: {solc: '0.6.1'},
        dappConnection: ['$WEB3', 'ws://localhost:8546', 'localhost:8545'],
        dappAutoEnable: true,
        "gas": "auto",
        "library": "embarkjs",
        "strategy": "implicit",
        "contracts": {
          "SimpleStorage": {
            "args": [100, '0x0000000000000000000000000000000000000000'],
            "address": '0x0000000000000000000000000000000000000000',
            "onDeploy": ["SimpleStorage.methods.changeAddress('0x0000000000000000000000000000000000000000')"]
          }
        },
        "afterDeploy": [
          "SimpleStorage.methods.changeAddress('0x0000000000000000000000000000000000000000')",
          "SimpleStorage.methods.changeAddress('$SomeToken')"
        ]
      };
      let zeroAddressconfig = new Config({
        env: 'zeroaddress',
        configDir: 'test1/config/',
        events: new Events(),
        embarkConfig: {
          versions: {}
        }
      });
      zeroAddressconfig.plugins = new Plugins({plugins: {}});
      zeroAddressconfig.logger = new TestLogger({});
      zeroAddressconfig.loadContractsConfigFile();
      assert.deepStrictEqual(zeroAddressconfig.contractsConfig, expectedConfig);
    });
  });

  describe('#loadExternalContractsFiles', function () {
    it('should create the right list of files and download', function () {
      config.contractsFiles = [];
      config.contractsConfig.contracts = [
        {
          file: 'https://github.com/embarklabs/embark/blob/master/dapps/templates/demo/contracts/simple_storage.sol'
        },
        {
          file: 'github.com/status-im/contracts/contracts/identity/ERC725.sol'
        },
        {
          file: 'bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63'
        }
      ];
      const expected = [
        {
          "type": "http",
          "externalUrl": "https://raw.githubusercontent.com/embarklabs/embark/master/dapps/templates/demo/contracts/simple_storage.sol",
          "path": dappPath(".embark/contracts/embarklabs/embark/master/dapps/templates/demo/contracts/simple_storage.sol"),
          "originalPath": ".embark/contracts/embarklabs/embark/master/dapps/templates/demo/contracts/simple_storage.sol",
          "pluginPath": '',
          "basedir": "",
          "importRemappings": [],
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": ""
        },
        {
          "type": "http",
          "externalUrl": "https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol",
          "path": dappPath(".embark/contracts/status-im/contracts/master/contracts/identity/ERC725.sol"),
          "originalPath": ".embark/contracts/status-im/contracts/master/contracts/identity/ERC725.sol",
          "pluginPath": '',
          "basedir": "",
          "importRemappings": [],
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": ""
        },
        {
          "externalUrl": "https://swarm-gateways.net/bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63",
          "path": dappPath(".embark/contracts/bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63"),
          "originalPath": ".embark/contracts/bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63",
          "type": "http",
          "pluginPath": '',
          "basedir": "",
          "importRemappings": [],
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": ""
        }
      ];
      config.loadExternalContractsFiles();
      const files = [Object.assign({}, config.contractsFiles[0]), Object.assign({}, config.contractsFiles[1]), Object.assign({}, config.contractsFiles[2])];
      assert.deepStrictEqual(files, expected);
    });
  });
});
