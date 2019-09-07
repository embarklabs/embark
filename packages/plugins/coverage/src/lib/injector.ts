import { ContractEnhanced } from "./contractEnhanced";
import { encrypt } from "./eventId";
import { CoverageEmitNodeType, InjectionPoint } from "./types";

import * as semver from "semver";
import parser, { ASTNode, ContractDefinition, EmitStatement, EventDefinition, ExpressionStatement } from "solidity-parser-antlr";

const EMIT_VERSION =  "0.4.21";

const EVENT_NODE = {
  name: "__StatementCoverage",
  parameters: {
    parameters: [
      {
        name: "value",
        type: "VariableDeclaration",
        typeName: { name: "uint32", type: "ElementaryTypeName" },
      },
    ],
    type: "ParameterList",
  },
  type: "EventDefinition",
};

export class Injector {
  private isEmitSupported: boolean;

  constructor(private contract: ContractEnhanced, private solcVersion: string) {
    this.solcVersion = solcVersion;
    this.isEmitSupported = semver.gte(this.solcVersion, EMIT_VERSION);
  }

  public process(injectionPoint: InjectionPoint) {
    switch (injectionPoint.type) {
      case "statement":
        return this.statement(injectionPoint);
      case "contractDefinition":
        return this.contractDefinition(injectionPoint);
    }
  }

  private emitStatementNode(id: number): CoverageEmitNodeType {
    // Depending on what solidity version we're handling, "emit" statements might not
    // be supported, so we check here.
    const functionCall = {
      arguments: [{ number: id.toString(), type: "NumberLiteral", subdenomination: null }],
      expression: { name: "__StatementCoverage", type: "Identifier" },
      names: [],
      type: "FunctionCall",
    };

    if (this.isEmitSupported) {
      return { eventCall: functionCall, type: "EmitStatement" } as EmitStatement;
    }

    return { expression: functionCall, type: "ExpressionStatement" } as ExpressionStatement;
  }

  private statement(injectionPoint: InjectionPoint) {
    const eventId = encrypt(this.contract.id, injectionPoint.id);

    // Get the proper node that we're going to inject instead of building a string.
    // There _might_ be a better way to do this.
    const node = this.emitStatementNode(eventId);
    this.insertAt(node, injectionPoint);
  }

  private contractDefinition(injectionPoint: InjectionPoint) {
    const contractNode = injectionPoint.node as ContractDefinition;
    contractNode.subNodes.splice(0, 0, EVENT_NODE as EventDefinition);
  }

  private insertAt(emit: CoverageEmitNodeType, injectionPoint: InjectionPoint) {
    const { parent, node } = injectionPoint;

    if (!parent) {
      return;
    }

    const idx = parent.statements.findIndex((s: ASTNode) => s.loc === node.loc);
    parent.statements.splice(idx, 0, emit);
  }
}
