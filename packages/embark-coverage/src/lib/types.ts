import { ASTNode, Block, EmitStatement, ExpressionStatement, Location } from "solidity-parser-antlr";

export type InjectionPointType = "statement" | "contractDefinition";
export type BranchType = "if" | "switch";
export type CoverageEmitNodeType = EmitStatement | ExpressionStatement;

export interface InjectionPoint {
  type: InjectionPointType;
  id: number;
  node: ASTNode;
  parent: Block | undefined;
}

export interface Coverage {
  b: { [branchId: number]: number[] };
  branchMap: {
    [branchId: number]: {
      line: number;
      locations: Location[];
      type: BranchType;
    };
  };
  code: string;
  f: { [functionId: number]: number };
  fnMap: {
    [functionId: number]: {
      line: number;
      loc: Location;
      name: string;
      skip?: boolean;
    };
  };
  l: { [line: number]: number };
  path: string;
  s: { [statementId: number]: number };
  statementMap: {
    [statementId: number]: Location;
  };
}
