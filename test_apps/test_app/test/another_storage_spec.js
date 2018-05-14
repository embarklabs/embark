
const DeploymentService = require('../../../lib/services/deploymentService');
const EthereumService = require('../../../lib/services/ethereumService');
const DeployManager = require('../../../lib/contracts/deploy_manager');

config({

  simulatorMnemonic: "some twelve word mnemonic for users who want it",
  node: "http://localhost:8545",
  myenv:{
    contracts:{
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage"]
      }
    }
  }
});

contract("AnotherStorage", function() {
  it("set SimpleStorage address", async function() {
    // inject testing bindings
    container.rebind('env').toConstantValue('myenv');
    //container.bind('configDir').toConstantValue('./test/test1/config/');
    container.bind('autoLoadAllConfigs').toConstantValue(false);

    // if we need to mock any instances, this is where we'd inject them!

    
    // set up our tests

    let ethereumService = container.resolve(EthereumService);
    ethereumService.start();

    let deploymentService = container.resolve(DeploymentService); // resolve = get + instantiation
    deploymentService.start();

    
    let deployManager = container.resolve(DeployManager);
    deployManager.deployContracts(() => {
      console.log('DONE deploying contracts');
    });

    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

});
