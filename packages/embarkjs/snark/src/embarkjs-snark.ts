import Circuit from "./circuit";
import * as fs from "fs-extra";
import { CircuitSetup } from ".";

export default class EmbarkJsSnark {
  [key: string]: any;
  constructor(private setups: CircuitSetup[]) { }

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
      setup.compiledCircuit = await fs.readJson(setup.compiledCircuit);
      setup.provingKey = await fs.readJson(setup.provingKey);
      setup.verificationKey = await fs.readJson(setup.verificationKey);
      const nameTitleCase = setup.name.charAt(0).toUpperCase() + setup.name.substr(1).toLowerCase();
      this[nameTitleCase] = new Circuit(setup);
    }
  }
}
