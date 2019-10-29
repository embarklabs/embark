import {__} from 'embark-i18n';
import {dappPath} from 'embark-utils';
import Web3 from 'web3';

export default class TrackingFunctions {
  constructor({config, fs, events, logger, trackContracts}) {
    this.config = config;
    this.enabled = (config.contractsConfig.tracking !== false) && (trackContracts !== false);
    this.chainsFilePath = dappPath(config.contractsConfig.tracking || ".embark/chains.json");
    this.env = config.env;
    this.fs = fs;
    this.events = events;
    this.logger = logger;
    this._web3 = null;
    this._chains = null;
    this._currentChain = null;
    this._block = null;

    this.ensureChainTrackerFile();

    this.events.on("blockchain:started", () => {
      this._web3 = null;
    });
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

      const exists = await this.fs.exists(this.chainsFilePath);
      if (!this.enabled || !exists) {
        this._chains = null;
        return this._chains;
      }

      this._chains = await this.fs.readJSON(this.chainsFilePath);
      return this._chains;
    })();
  }

  set chains(chains) {
    this._chains = chains;
    // chains has changed, therefore currentChain should too
    // reset the backing variable for currentChain so it can be recalculated on next get
    this._currentChain = null;
  }

  get currentChain() {
    return (async () => {
      if (this._currentChain) {
        return this._currentChain;
      }

      if (!this.enabled) {
        return null;
      }

      const chains = (await this.chains) || {};
      const {hash} = await this.block;
      this._currentChain = chains[hash] || {
        contracts: {},
        name: this.env
      };
      return this._currentChain;
    })();
  }

  get block() {
    return (async () => {
      if (this._block) {
        return this._block;
      }
      const web3 = await this.web3;
      try {
        this._block = await web3.eth.getBlock(0, true);
      } catch (err) {
        // Retry with block 1 (Block 0 fails with Ganache-cli using the --fork option)
        this._block = await web3.eth.getBlock(1, true);
      }
      return this._block;
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
    await this.save();
    cb();
  }

  async ensureChainTrackerFile() {
    if (!this.enabled) return;
    const exists = await this.fs.exists(this.chainsFilePath);
    if (!exists) {
      this.logger.info(this.chainsFilePath + ' ' + __('file not found, creating it...'));
      const {hash} = await this.block;
      return this.fs.outputJSON(this.chainsFilePath, {
        [hash]: {
          contracts: {},
          name: this.env
        }
      });
    }
  }

  async trackContract(contract) {
    const currentChain = await this.currentChain;
    if (!this.enabled || !currentChain) return false;
    const toTrack = {name: contract.className, address: contract.deployedAddress};
    if (contract.track === false) toTrack.track = false;
    const {hash} = await this.block;
    const chains = await this.chains;
    if (!chains[hash]) {
      chains[hash] = {
        contracts: {},
        name: this.env
      };
    }
    chains[hash].contracts[contract.hash] = toTrack;
    this.chains = chains;
  }

  async save() {
    const chains = await this.chains;
    if (!this.enabled || !chains) {
      return;
    }
    return this.fs.writeJSON(this.chainsFilePath, chains, {spaces: 2});
  }
}
