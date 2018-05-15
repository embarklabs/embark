/*globals describe, it, container, before, after, config, contract, assert*/
const Plugins = require('../../../lib/core/plugins.js');
const DeployManager = require('../../../lib/contracts/deploy_manager.js');

describe("AnotherStorage contract", function(){
  before(function() {
    container.snapshot();

    // inject testing bindings
    container.bind('autoLoadAllConfigs').toConstantValue(false);
    container.bind('env').toConstantValue('development');

    // if we need to mock any instances, this is where we'd inject them!

    let plugins = container.resolve(Plugins);
    plugins.loadInternalPlugin('solidity', {solcVersion: '0.4.23', contractDirectories: ['app/contracts/']});
    container.unbind(Plugins);
    container.bind(Plugins).toConstantValue(plugins);

  });

  after(function(){
    container.restore();
  });
  config({ // contractsConfig
    "versions": {
      "web3.js": "1.0.0-beta",
      "solc": "0.4.23"
    },
    "deployment": {
      "host": "localhost",
      "port": 8545,
      "type": "rpc"
    },
    "dappConnection": [
      "$WEB3",
      "localhost:8545"
    ],
    "gas": "auto",
    "contracts": {
      "Token": {
        "args": [
          100
        ]
      },
      "SimpleStorage": {
        "args": [
          200
        ]
      }
    }
  }, 
  ['app/contracts/another_storage.sol'], // contractFiles
  ['app/contracts']); // contractDirectories

  contract("AnotherStorage", function() {

    let ethProvider = container.get('EthereumProvider');
    let owner = ethProvider.providerObject.eth.accounts[0];

    it("set SimpleStorage address", function() {
      let deployMgr = container.get(DeployManager);
      deployMgr.deployContracts(() => {
        const AnotherStorage = require('Embark/AnotherStorage');
        const SimpleStorage = require('Embark/SimpleStorage');
  
        let result = AnotherStorage.methods.simpleStorageAddress().call();
        assert.equal(result.toString(), SimpleStorage.options.address);
      });

      
    });

  });
});

