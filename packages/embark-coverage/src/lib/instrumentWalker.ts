import parser, {
  ASTNode,
  Block,
  BreakStatement,
  ContinueStatement,
  ContractDefinition,
  EmitStatement,
  ExpressionStatement,
  FunctionDefinition,
  IfStatement,
  ReturnStatement,
  SourceUnit,
  ThrowStatement,
  VariableDeclarationStatement,
  WhileStatement,
} from "solidity-parser-antlr";
import { Instrumenter } from "./instrumenter";

export class InstrumentWalker {
  private blockStack: Block[];

  constructor(private instrumenter: Instrumenter) {
    this.blockStack = [];
  }

  private blockTail(): Block {
    return this.blockStack[this.blockStack.length - 1];
  }

  public walk(ast: ASTNode) {
    parser.visit(ast, {
      "Block": (node: Block) => {
        this.blockStack.push(node);
      },
      "Block:exit": (node: Block) => {
        this.blockStack.pop();
      },
      "BreakStatement": (node: BreakStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "ContinueStatement": (node: ContinueStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "ContractDefinition": (node: ContractDefinition) => {
        this.instrumenter.instrumentContractDefinition(node);
      },
      "EmitStatement": (node: EmitStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "ExpressionStatement": (node: ExpressionStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "FunctionDefinition": (node: FunctionDefinition) => {
        this.instrumenter.instrumentFunction(node);
      },
      "IfStatement": (node: IfStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
        this.instrumenter.instrumentIfStatement(node);
      },
      "ReturnStatement": (node: ReturnStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "ThrowStatement": (node: ThrowStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "VariableDeclarationStatement": (node: VariableDeclarationStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
      "WhileStatement": (node: WhileStatement) => {
        this.instrumenter.instrumentStatement(node, this.blockTail());
      },
    });
  }
}
