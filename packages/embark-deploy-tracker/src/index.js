import { __ } from 'embark-i18n';
import { dappPath, sha3 } from 'embark-utils';
const Web3 = require('web3');

class DeployTracker {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.fs = embark.fs;
    this.embark = embark;
    this.trackContracts = (options.trackContracts !== false);

    // TODO: unclear where env comes from
    // TODO: we should be getting the env from a request to the config
    this.env = options.env;
    this.chainConfig = {};
    this.chainFile = embark.config.contractsConfig.tracking;

    this.events.on("blockchain:started", this.loadChainTrackerFile.bind(this));
    this.embark.registerActionForEvent('deployment:deployContracts:beforeAll', this.setCurrentChain.bind(this));
    // this.embark.registerActionForEvent("deployment:contract:deployed", this.trackAndSaveContract.bind(this));
    // this.embark.registerActionForEvent("deploy:contract:shouldDeploy", this.checkIfDeploymentIsNeeded.bind(this));
  }

  trackAndSaveContract(params, cb) {
    if (!this.embark.config.contractsConfig.tracking) return;
    let contract = params.contract;
    this.trackContract(contract.className, contract.realRuntimeBytecode, contract.realArgs, contract.deployedAddress);
    this.save();
  }

  checkIfDeploymentIsNeeded(params, cb) {
    if (!this.embark.config.contractsConfig.tracking) return;
    if (!this.trackContracts) {
      return cb(null, params);
    }

    let contract = params.contract;
    let trackedContract = this.getContract(contract.className, contract.realRuntimeBytecode, contract.realArgs);
    if (trackedContract) {
      params.contract.address = trackedContract.address;
    }
    if (params.shouldDeploy && trackedContract) {
      params.shouldDeploy = true;
    }
    cb(null, params);
  }

  loadChainTrackerFile() {
    if (this.chainFile === false) return;
    if (this.chainFile === undefined) this.chainFile = ".embark/chains.json";
    this.chainFile = dappPath(this.chainFile);
    if (!this.fs.existsSync(this.chainFile)) {
      this.logger.info(this.chainFile + ' ' + __('file not found, creating it...'));
      this.fs.outputJSONSync(this.chainFile, {});
    }

    this.chainConfig = this.fs.readJSONSync(this.chainFile);
  }

  setCurrentChain(_params, callback) {
    if (!this.embark.config.contractsConfig.tracking) return;
    if (this.chainFile === false) return;
    if (this.chainConfig === false) {
      this.currentChain = {contracts: []};
      return callback();
    }

    this.getBlock(0, (err) => {
      if (err) {
        // Retry with block 1 (Block 0 fails with Ganache-cli using the --fork option)
        return this.getBlock(1, callback);
      }
      callback();
    });
  }

  async getBlock(blockNum, cb) {
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    var web3 = new Web3(provider);

    try {
      let block = await web3.eth.getBlock(blockNum, true);
      let chainId = block.hash;

      if (self.chainConfig[chainId] === undefined) {
        self.chainConfig[chainId] = { contracts: {} };
      }

      self.currentChain = self.chainConfig[chainId];

      self.currentChain.name = self.env;
      cb();
    } catch (err) {
      return cb(err);
    }
  }

  loadConfig(config) {
    this.chainConfig = config;
    return this;
  }

  trackContract(name, code, args, address) {
    if (!this.currentChain) return false;
    this.currentChain.contracts[sha3(code + name + args.join(','))] = { name, address };
  }

  getContract(name, code, args) {
    if (!this.currentChain) return false;
    let contract = this.currentChain.contracts[sha3(code + name + args.join(','))];
    if (contract && contract.address === undefined) {
      return false;
    }
    return contract;
  }

  save() {
    if (this.chainConfig === false) {
      return;
    }
    this.fs.writeJSONSync(this.chainFile, this.chainConfig, {spaces: 2});
  }

}

module.exports = DeployTracker;
