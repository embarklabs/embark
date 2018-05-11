const Events = require('../core/events');
const Logger = require('../core/logger');
const Config = require('../core/config');
const Plugins = require('../core/plugins');
const Pipeline = require('../pipeline/pipeline');
const Upload = require('../commands/upload');
const ServicesMonitor = require('../core/services_monitor');
const DeployManager = require('../contracts/deploy_manager');
const DeploymentService = require('../services/deploymentService');
const EthereumService = require('../services/ethereumService');
const ContractsManager = require('../contracts/contracts');
const Web3Provider = require('../providers/web3Provider');
const inversify = require("inversify");

// Declare bindings
let container = new inversify.Container({defaultScope: "Singleton"});

/*********************************
 * SELF BINDINGS 
 * Used to inject an instance of itelf (doesn't require any special bindings)
 ********************************/
container.bind(Events).toSelf();
container.bind(Logger).toSelf();
container.bind(Config).toSelf(); // possibly should separate configs and include ConfigManager.
container.bind(Pipeline).toSelf();
container.bind(Plugins).toSelf();
container.bind(Upload).toSelf();
container.bind(ServicesMonitor).toSelf();
container.bind(DeploymentService).toSelf();
container.bind(ContractsManager).toSelf();
container.bind(DeployManager).toSelf();
container.bind(EthereumService).toSelf();

/********************************
 * DYNAMIC OR MANUAL BINDINGS
 * Used to create bindings that can't be resolved by creating a purely injected instance, 
 * ie, 
 * 1. we want to inject a provider/service dynamically based on config
 * 2. when we need to pass in a value to the constructor that is not injected
 * 3. the injected value depends on something that has been passed in from the command line
 * 4. ... etc 
 */

// Here, we can replace Web3Provider with EthersProvider to use ethers.js. (maybe spec'd in a config???)
// ideally, the provider object would support an interface (ie IEthereumProvider),
// so that any other objects that depend on the EthereumService could utilise all
// methods of EthereumService.IEthereumProvider (which would have either the Web3Provider 
// or EthersProvider) as the injected instance
container.bind('EthereumProvider').to(Web3Provider);

module.exports = container;
