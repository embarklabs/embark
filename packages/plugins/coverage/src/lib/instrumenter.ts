import {
  ASTNode,
  Block,
  ContractDefinition,
  FunctionDefinition,
  IfStatement,
  Location,
  ModifierDefinition,
  Statement,
} from "solidity-parser-antlr";

import {ContractEnhanced} from "./contractEnhanced";
import {InjectionPoint, InjectionPointType} from "./types";

export class Instrumenter {
  private injectionPoints: InjectionPoint[] = [];

  constructor(private contract: ContractEnhanced) {
  }

  public getInjectionPoints() {
    return this.injectionPoints.sort((a, b) => {
      return (a.node.loc && b.node.loc) ? b.node.loc.start.line - a.node.loc.start.line : 0;
    });
  }

  public instrumentContractDefinition(node: ContractDefinition) {
    if (!node.loc) {
      return;
    }

    if (node.loc.start.line === node.loc.end.line) {
      return;
    }

    this.addInjectionPoints("contractDefinition", 1, node);
  }

  public instrumentFunction(node: FunctionDefinition) {
    // Remove stateMutability so that the function is not exported
    // as "view" or "pure", seen as it will contain some emit
    // statements and those require a transaction.
    if (node.stateMutability === "view" || node.stateMutability === "pure") {
      node.stateMutability = undefined;
    }

    if (!node.loc) {
      return;
    }

    if (!node.body || !node.body.loc) {
      return;
    }

    if (node.body.loc.start.line === node.body.loc.end.line) {
      return;
    }

    this.contract.addFunction(node.loc, node.name || "", node.body.loc);
  }

  public instrumentStatement(node: Statement, parent: Block) {
    if (!node.loc) {
      return;
    }

    const id = this.contract.addStatement(node.loc);
    this.addInjectionPoints("statement", id, node, parent);
  }

  public instrumentIfStatement(node: IfStatement) {
    if (!node.loc) {
      return;
    }

    // Ensure that the trueBody and falseBody are Blocks. This prevents single
    // statement `if` checks from breaking when we try to add an emit statement.
    node.trueBody = this.wrapInBlock(node.trueBody);

    if (node.falseBody) {
      node.falseBody = this.wrapInBlock(node.falseBody);
    }

    const locations = [node.trueBody, node.falseBody].reduce((acc: Location[], body) => {
      if (body && body.loc) {
        acc.push(body.loc);
      }
      return acc;
    }, []);

    this.contract.addBranch(node.loc.start.line, "if", locations);
  }

  private wrapInBlock(node: Statement): Block {
    if (node.type === "Block") {
      return node;
    }

    const newNode: Block = {
      loc: node.loc,
      range: node.range,
      statements: [node],
      type: "Block",
    };

    return newNode;
  }

  private addInjectionPoints(type: InjectionPointType, id: number, node: ASTNode, parent?: Block | undefined) {
    this.injectionPoints.push({type, id, node, parent});
  }
}
