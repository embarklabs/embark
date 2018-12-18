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
      case "contractDefinition":
        return this.contractDefinition(injectionPoint);
    }
  }

  private statement(injectionPoint: InjectionPoint) {
    const data = `emit __StatementCoverage(${encrypt(this.contract.id, injectionPoint.id)});`;
    this.insertAt(injectionPoint.location.start.line - 1, data);
  }

  private contractDefinition(injectionPoint: InjectionPoint) {
    const data = [
      "event __StatementCoverage(uint32 value);",
    ].join("\n");

    this.insertAt(injectionPoint.location.start.line, data);
  }

  private insertAt(line: number, data: string) {
    const lines = this.contract.source.split("\n");
    lines.splice(line, 0, data);
    this.contract.source = lines.join("\n");
  }
}
