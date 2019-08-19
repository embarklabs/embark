import {__} from 'embark-i18n';
import {toChecksumAddress} from 'embark-utils';
import Web3 from "web3";

export default class DeploymentChecks {
  constructor({trackingFunctions, logger, events, plugins}) {
    this.trackingFunctions = trackingFunctions;
    this.logger = logger;
    this.events = events;
    this.plugins = plugins;
    this._web3 = null;
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
    const trackedContract = this.trackingFunctions.getContract(contract);

    // previous event action check
    if (!params.shouldDeploy) {
      return cb(null, params);
    }

    // contract is not already tracked - deploy
    if (!trackedContract || !trackedContract.address) {
      return cb(null, params);
    }

    // tracked contract has track field set - deploy anyway, but tell user
    if (trackedContract.track === false || this.trackingFunctions.trackContracts === false) {
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
    if (codeInChain.length > 3) { // it is "0x" or "0x0" for empty code, depending on web3 version
      contract.deployedAddress = trackedContract.address;
      contract.log(contract.className.bold.cyan + __(" already deployed at ").green + contract.deployedAddress.bold.cyan);
      params.shouldDeploy = false;
    }
    cb(null, params);
  }
}
