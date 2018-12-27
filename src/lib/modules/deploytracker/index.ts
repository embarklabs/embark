const utils = require("../../utils/utils.js");
const fs = require("../../core/fs.js");

class DeployTracker {
  private logger: any;
  private events: any;
  private embark: any;
  private trackContracts: any;
  private env: any;
  private chainConfig: any;
  private currentChain: any;

  constructor(embark: any, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.embark = embark;
    this.trackContracts = (options.trackContracts !== false);

    // TODO: unclear where it comes from
    this.env = options.env;
    // this.chainConfig = options.chainConfig;
    this.chainConfig = embark.config.chainTracker;
    this.registerEvents();
  }

  private registerEvents() {
    this.embark.registerActionForEvent("deploy:beforeAll", this.setCurrentChain.bind(this));

    this.events.on("deploy:contract:deployed", (contract: any) => {
      this.trackContract(contract.className, contract.realRuntimeBytecode, contract.realArgs, contract.deployedAddress);
      this.save();
    });

    this.embark.registerActionForEvent("deploy:contract:shouldDeploy", (params: any, cb: any) => {
      if (!this.trackContracts) {
        return cb(params);
      }

      const contract = params.contract;
      const trackedContract = this.getContract(contract.className, contract.realRuntimeBytecode, contract.realArgs);
      if (trackedContract) {
        params.contract.address = trackedContract.address;
      }
      if (params.shouldDeploy && trackedContract) {
         params.shouldDeploy = true;
      }
      cb(params);
    });
  }

  private setCurrentChain(cb: any) {
    if (this.chainConfig === false) {
      this.currentChain = {contracts: []};
      return cb();
    }
    this.events.request("blockchain:block:byNumber", 0, (_err: any, block: any) => {
      const chainId = block.hash;

      if (this.chainConfig[chainId] === undefined) {
        this.chainConfig[chainId] = {contracts: {}};
      }

      this.currentChain = this.chainConfig[chainId];

      this.currentChain.name = this.env;
      cb();
    });
  }

  // TODO: this does not seem to be used
  private loadConfig(config: any) {
    this.chainConfig = config;
    return this;
  }

  private trackContract(contractName: string, code: string, args: string[], address: any) {
    if (!this.currentChain) {
      return false;
    }
    this.currentChain.contracts[utils.sha3(code + contractName + args.join(","))] = {
      address,
      name: contractName,
    };
  }

  private getContract(contractName: string, code: string, args: string[]) {
    if (!this.currentChain) {
      return false;
    }
    const contract = this.currentChain.contracts[utils.sha3(code + contractName + args.join(","))];
    if (contract && contract.address === undefined) {
      return false;
    }
    return contract;
  }

  // TODO: abstract this
  // chainConfig can be an abstract PersistentObject
  private save() {
    if (this.chainConfig === false) {
      return;
    }
    fs.writeJSONSync("./chains.json", this.chainConfig, {spaces: 2});
  }

}

export default DeployTracker;
