import parser, {
  ASTNode,
  BreakStatement,
  ContinueStatement,
  ContractDefinition,
  EmitStatement,
  ExpressionStatement,
  FunctionDefinition,
  IfStatement,
  ModifierDefinition,
  ReturnStatement,
  ThrowStatement,
  VariableDeclarationStatement,
  WhileStatement,
} from "solidity-parser-antlr";
import { Instrumenter } from "./instrumenter";

export class InstrumentWalker {
  constructor(private instrumenter: Instrumenter) {
  }

  public walk(ast: ASTNode) {
    parser.visit(ast, {
      BreakStatement: (node: BreakStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      ContinueStatement: (node: ContinueStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      ContractDefinition: (node: ContractDefinition) => {
        this.instrumenter.instrumentContractDefinition(node);
      },
      EmitStatement: (node: EmitStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      ExpressionStatement: (node: ExpressionStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      FunctionDefinition: (node: FunctionDefinition) => {
        this.instrumenter.instrumentFunction(node);
      },
      IfStatement: (node: IfStatement) => {
        this.instrumenter.instrumentStatement(node);
        this.instrumenter.instrumentIfStatement(node);
      },
      ModifierDefinition: (node: ModifierDefinition) => {
        this.instrumenter.instrumentFunction(node);
      },
      ReturnStatement: (node: ReturnStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      ThrowStatement: (node: ThrowStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      VariableDeclarationStatement: (node: VariableDeclarationStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
      WhileStatement: (node: WhileStatement) => {
        this.instrumenter.instrumentStatement(node);
      },
    });
  }
}
