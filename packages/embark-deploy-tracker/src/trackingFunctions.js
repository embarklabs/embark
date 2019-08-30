import {__} from 'embark-i18n';
import {dappPath} from 'embark-utils';
import Web3 from 'web3';

export default class TrackingFunctions {
  constructor({config, env, fs, events, logger, trackContracts}) {
    this.config = config;
    this.enabled = (config.contractsConfig.tracking !== false) && (trackContracts !== false);
    this.chainsFilePath = dappPath(config.contractsConfig.tracking || ".embark/chains.json");
    this.env = env;
    this.fs = fs;
    this.events = events;
    this.logger = logger;
    this._web3 = null;
    this._chains = null;
    this._currentChain = null;
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

  get chains() {
    return (async () => {
      if (this._chains) {
        return this._chains;
      }
      if (!this.enabled) {
        this._chains = null;
        return this._chains;
      }
      this._chains = await this.fs.readJSON(this.chainsFilePath);
      return this._chains;
    })();
  }

  get currentChain() {
    return (async () => {
      if (this._currentChain) {
        return this._currentChain;
      }
      if (!this.enabled) {
        this._currentChain = {contracts: []};
        return this._currentChain;
      }

      let block;
      const web3 = await this.web3;
      try {
        block = await web3.eth.getBlock(0, true);
      } catch (err) {
        // Retry with block 1 (Block 0 fails with Ganache-cli using the --fork option)
        block = await web3.eth.getBlock(1, true);
      }
      const {hash} = block;
      this._currentChain = (await this.chains)[hash];
      if (this._currentChain === undefined) {
        const empty = {contracts: {}};
        this._chains[hash] = empty;
        this._currentChain = empty;
      }

      this._currentChain.name = this.env;

      return this._currentChain;
    })();
  }

  async getContract(contract) {
    const currentChain = await this.currentChain;
    if (!currentChain || !this.enabled) return false;
    let contractInFile = currentChain.contracts[contract.hash];
    if (contractInFile && contractInFile.address === undefined) {
      return false;
    }
    return contractInFile;
  }

  async trackAndSaveContract(params, cb) {
    const {contract} = params;
    if (!this.enabled) return cb();
    await this.trackContract(contract);
    this.save();
    cb();
  }

  async ensureChainTrackerFile() {
    if (!this.enabled) return;
    const exists = await this.fs.exists(this.chainsFilePath);
    if (!exists) {
      this.logger.info(this.chainsFilePath + ' ' + __('file not found, creating it...'));
      return this.fs.outputJSON(this.chainsFilePath, {});
    }
  }

  async trackContract(contract) {
    const currentChain = await this.currentChain;
    if (!this.enabled || !currentChain) return false;
    const toTrack = {name: contract.className, address: contract.deployedAddress};
    if (contract.track === false) toTrack.track = false;
    currentChain.contracts[contract.hash] = toTrack;
  }

  async save() {
    if (!this.enabled) {
      return;
    }
    return this.fs.writeJSON(this.chainsFilePath, await this.chains, {spaces: 2});
  }
}
