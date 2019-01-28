import {
  ContractDefinition,
  FunctionDefinition,
  IfStatement,
  Location,
  Statement,
} from "solidity-parser-antlr";

import { ContractEnhanced } from "./contractEnhanced";
import { InjectionPoint, InjectionPointType } from "./types";

export class Instrumenter {
  private injectionPoints: InjectionPoint[] = [];

  constructor(private contract: ContractEnhanced) {
  }

  public getInjectionPoints() {
    return this.injectionPoints.sort((a, b) => b.location.start.line - a.location.start.line);
  }

  public instrumentContractDefinition(node: ContractDefinition) {
    if (!node.loc) {
      return;
    }

    if (node.loc.start.line === node.loc.end.line) {
      return;
    }

    this.addInjectionPoints("contractDefinition", 1, node.loc);
  }

  public instrumentFunction(node: FunctionDefinition) {
    if (!node.loc) {
      return;
    }

    if (!node.body || !node.body.loc) {
      return;
    }

    if (node.body.loc.start.line === node.body.loc.end.line) {
      return;
    }

    this.contract.addFunction(node.loc, node.name, node.body.loc);
  }

  public instrumentStatement(node: Statement) {
    if (!node.loc) {
      return;
    }

    const id = this.contract.addStatement(node.loc);
    this.addInjectionPoints("statement", id, node.loc);
  }

  public instrumentIfStatement(node: IfStatement) {
    if (!node.loc) {
      return;
    }

    const locations = [node.trueBody, node.falseBody].reduce((acc: Location[], body) => {
      if (body && body.loc) {
        acc.push(body.loc);
      }
      return acc;
    }, []);

    this.contract.addBranch(node.loc.start.line, "if", locations);
  }

  private addInjectionPoints(type: InjectionPointType, id: number, location: Location) {
    this.injectionPoints.push({type, id, location});
  }
}
