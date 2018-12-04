import { ContractEnhanced } from "./contractEnhanced";
import { encrypt } from "./eventId";
import { InjectionPoint } from "./types";

export class Injector {

  constructor(private contract: ContractEnhanced) {
  }

  public process(injectionPoint: InjectionPoint) {
    switch (injectionPoint.type) {
      case "statement":
        return this.statement(injectionPoint);
      case "function":
        return this.function(injectionPoint);
      case "branch":
      return this.branch(injectionPoint);
      case "contractDefinition":
        return this.contractDefinition(injectionPoint);
    }
  }

  private statement(injectionPoint: InjectionPoint) {
    const data = `emit __StatementCoverage(${encrypt(this.contract.id, injectionPoint.id)});`;
    this.insertAt(injectionPoint.location.start.line - 1, data);
  }

  private function(injectionPoint: InjectionPoint) {
    const data = `emit __FunctionCoverage(${encrypt(this.contract.id, injectionPoint.id)});`;
    this.insertAt(injectionPoint.location.start.line, data);
  }

  private branch(injectionPoint: InjectionPoint) {
    const data = `emit __BranchCoverage(${encrypt(this.contract.id, injectionPoint.id, injectionPoint.locationIdx)});`;
    this.insertAt(injectionPoint.location.start.line, data);
  }

  private contractDefinition(injectionPoint: InjectionPoint) {
    const data = [
      "event __FunctionCoverage(uint32 value);",
      "event __StatementCoverage(uint32 value);",
      "event __BranchCoverage(uint32 value);",
    ].join("\n");

    this.insertAt(injectionPoint.location.start.line, data);
  }

  private insertAt(line: number, data: string) {
    const lines = this.contract.source.split("\n");
    lines.splice(line, 0, data);
    this.contract.source = lines.join("\n");
  }
}
