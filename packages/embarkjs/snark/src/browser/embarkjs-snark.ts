/* global EmbarkJS */
import { CircuitSetup, PluginConfig } from "..";
import Circuit from "../circuit";

export default class EmbarkJsSnark {
  [key: string]: any;
  private buildDir: string;
  private buildDirUrl: string;
  private contractsJsonDirUrl: string;
  constructor(private setups: CircuitSetup[], private config: PluginConfig) {
    this.buildDir = this.config.buildDir || "public/snarks/";
    this.buildDirUrl = this.config.buildDirUrl || "/snarks/";
    this.contractsJsonDirUrl = this.config.contractsJsonDirUrl || "/snarks/contracts/";
  }

  buildUrl(filepath: string) {
    return filepath.replace(this.buildDir || "public/", this.buildDirUrl || "/");
  }

  public async init() {
    for (const setup of this.setups) {
      if (setup.config.exclude) {
        continue;
      }
      if (!setup.provingKey) {
        throw new Error("Error getting proving key: path not provided.");
      }
      if (!setup.verificationKey) {
        throw new Error("Error getting verification key: path not provided.");
      }
      if (!setup.compiledCircuit) {
        throw new Error("Error getting compiled circuit: path not provided.");
      }
      setup.compiledCircuit = await (await fetch(this.buildUrl(setup.compiledCircuit))).json();
      setup.provingKey = await (await fetch(this.buildUrl(setup.provingKey))).json();
      setup.verificationKey = await (await fetch(this.buildUrl(setup.verificationKey))).json();
      const verifierContractJson = await (await fetch(`${this.contractsJsonDirUrl}${setup.verifierContractName}.json`)).json();
      setup.verificationContract = new EmbarkJS.Blockchain.Contract(verifierContractJson);
      const nameTitleCase = setup.name.charAt(0).toUpperCase() + setup.name.substr(1).toLowerCase();
      this[nameTitleCase] = new Circuit(setup);
    }
  }
}
