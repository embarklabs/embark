import {__} from 'embark-i18n';
import {dappPath} from 'embark-utils';
import Web3 from 'web3';

export default class TrackingFunctions {
  constructor({config, env, fs, events, logger, trackContracts}) {
    this.config = config;
    this.chainConfig = {};
    this.chainFile = config.contractsConfig.tracking;
    this.currentChain = null;
    this.env = env;
    this.fs = fs;
    this.events = events;
    this.logger = logger;
    this._web3 = null;
    this.trackContracts = (trackContracts !== false);
  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  getContract(contract) {
    if (!this.currentChain) return false;
    let contractInFile = this.currentChain.contracts[contract.hash];
    if (contractInFile && contractInFile.address === undefined) {
      return false;
    }
    return contractInFile;
  }

  trackAndSaveContract(params, cb) {
    const {contract} = params;
    if (!this.chainFile || !this.trackContracts || contract.track === false) return cb();
    this.trackContract(contract);
    this.save();
    cb();
  }

  loadChainTrackerFile() {
    if (this.chainFile === false) return;
    if (this.chainFile === undefined) this.chainFile = ".embark/chains.json";
    this.chainFile = dappPath(this.chainFile);
    if (!this.fs.existsSync(this.chainFile)) {
      this.logger.info(this.chainFile + ' ' + __('file not found, creating it...'));
      this.fs.outputJSONSync(this.chainFile, {});
      this.chainConfig = {};
      return;
    }

    this.chainConfig = this.fs.readJSONSync(this.chainFile);
  }

  setCurrentChain(_params, callback) {
    if (!this.chainFile) return callback();
    if (this.chainFile === false) return callback();
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
    try {
      const web3 = await this.web3;
      let block = await web3.eth.getBlock(blockNum, true);
      let chainId = block.hash;

      if (this.chainConfig[chainId] === undefined) {
        this.chainConfig[chainId] = {contracts: {}};
      }

      this.currentChain = this.chainConfig[chainId];

      this.currentChain.name = this.env;
      cb();
    } catch (err) {
      return cb(err);
    }
  }

  loadConfig(config) {
    this.chainConfig = config;
    return this;
  }

  trackContract(contract) {
    if (!this.currentChain) return false;
    this.currentChain.contracts[contract.hash] = {name: contract.className, address: contract.deployedAddress};
  }

  save() {
    if (this.chainConfig === false) {
      return;
    }
    this.fs.writeJSONSync(this.chainFile, this.chainConfig, {spaces: 2});
  }
}
