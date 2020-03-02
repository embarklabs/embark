import {__} from 'embark-i18n';
import {toChecksumAddress} from 'embark-utils';
import Web3 from "web3";
require("colors");

export default class DeploymentChecks {
  constructor({trackingFunctions, events, logger, contractsConfig}) {
    this.trackingFunctions = trackingFunctions;
    this.events = events;
    this.logger = logger;
    this._web3 = null;
    this.contractsConfig = contractsConfig || {};

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

  async checkContractConfig(params, cb) {
    const {contract} = params;

    // previous event action check
    if (!params.shouldDeploy) {
      return cb(null, params);
    }

    const isInterface = this.contractsConfig.interfaces && this.contractsConfig.interfaces.includes(contract.className);
    const isLibrary = this.contractsConfig.libraries && this.contractsConfig.libraries.includes(contract.className);

    if (isInterface || isLibrary) {
      contract.deploy = false;
    }

    // check if contract set to not deploy in the config
    if (contract.deploy === false) {
      params.shouldDeploy = false;
      return cb(null, params);
    }

    // contract config address field set - do not deploy
    if (contract.address !== undefined) {
      try {
        toChecksumAddress(contract.address);
      } catch (e) {
        return cb(e);
      }
      contract.deployedAddress = contract.address;
      contract.log(contract.className.bold.cyan + __(" already deployed at ").green + contract.deployedAddress.bold.cyan);
      params.shouldDeploy = false;
      return cb(null, params);
    }

    cb(null, params);
  }

  async checkIfAlreadyDeployed(params, cb) {
    const {contract} = params;
    const trackedContract = await this.trackingFunctions.getContract(contract);

    // previous event action check
    if (!params.shouldDeploy) {
      return cb(null, params);
    }

    // contract is not already tracked - deploy
    if (!trackedContract || !trackedContract.address) {
      return cb(null, params);
    }

    // tracked contract has track field set - deploy anyway, but tell user
    if (contract.track === false || this.trackingFunctions.trackContracts === false) {
      contract.log(contract.className.bold.cyan + __(" will be redeployed").green);
      return cb(null, params);
    }

    // if bytecode for the contract in chains.json exists on chain - don't deploy
    const web3 = await this.web3;
    let codeInChain = "";
    try {
      codeInChain = await web3.eth.getCode(trackedContract.address);
    }
    catch (err) {
      return cb(err);
    }
    const skipBytecodeCheck = (this.contractsConfig?.contracts && this.contractsConfig.contracts[params.contract.className]?.skipBytecodeCheck) ?? false;
    if (skipBytecodeCheck) {
      this.logger.warn(__("WARNING: Skipping bytecode check for %s deployment. Performing an embark reset may cause the contract to be re-deployed to the current node regardless if it was already deployed on another node in the network.", params.contract.className));
    }
    if (skipBytecodeCheck ||
      (codeInChain.length > 3 && codeInChain.substring(2) === contract.runtimeBytecode)) { // it is "0x" or "0x0" for empty code, depending on web3 version
      contract.deployedAddress = trackedContract.address;
      contract.log(contract.className.bold.cyan + __(" already deployed at ").green + contract.deployedAddress.bold.cyan);
      params.shouldDeploy = false;

      // handle special case where user has changed their DApp config from `track: false`,
      // deployed (which is then saved in chains.json), then changed to `track: true|undefined`
      // in this case we assume
      // 1) the contract is already tracked
      // 2) contract.track is truthy
      if (contract.track !== false) {
        return this.trackingFunctions.trackAndSaveContract(params, () => {
          // no need to wait for this function to finish as it has no impact on operation
          // past this point
          this.logger.trace(__("Contract tracking setting has been updated in chains.json"));
          cb(null, params);
        });
      }
    }
    cb(null, params);
  }
}
