import { __ } from 'embark-i18n';
import Web3 from 'web3';
import { Embark, EmbarkEvents, ContractsConfig } from 'embark-core';

declare module "embark-core" {
  interface ContractConfig {
    privateFor: string[];
    privateFrom: string;
  }
}

export default class QuorumDeployer {
  private events: EmbarkEvents;
  private _web3: Web3 | null = null;
  private contractsConfig: ContractsConfig;
  constructor(private embark: Embark) {
    this.events = embark.events;
    this.contractsConfig = embark.config.contractsConfig?.contracts;
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

  public registerDeployer() {
    this.embark.registerActionForEvent("deployment:contract:beforeDeploy", this.addAdditionalDeployParams.bind(this));
  }

  private async addAdditionalDeployParams(params, callback) {
    const web3 = await this.web3;
    const contract = params.contract;

    const code = contract.code.substring(0, 2) === '0x' ? contract.code : "0x" + contract.code;
    const privateFor = this.contractsConfig && this.contractsConfig[contract.className]?.privateFor;
    if (privateFor) {
      params.additionalDeployParams = { ...params.additionalDeployParams, privateFor };
    }
    const privateFrom = this.contractsConfig && this.contractsConfig[contract.className]?.privateFrom;
    if (privateFrom) {
      params.additionalDeployParams = { ...params.additionalDeployParams, privateFrom };
    }
    if (privateFor || privateFrom) {
      const contractObj = new web3.eth.Contract(contract.abiDefinition, contract.address);
      const bytecodeWithInitParam = contractObj.deploy({ arguments: (contract.args || []), data: code }).encodeABI();
      params.additionalDeployParams.bytecodeWithInitParam = bytecodeWithInitParam;
    }
    callback(null, params);
  }
}
