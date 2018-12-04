import { ContractEnhanced } from "./contractEnhanced";

export class Suppressor {

  constructor(private contract: ContractEnhanced) {
  }

  public process() {
    this.contract.source = this.contract.source.replace(/pure/g, "");
    this.contract.source = this.contract.source.replace(/view/g, "");
  }
}
