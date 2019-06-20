import fs from "fs";

import prettier from "prettier";
import { printers } from "prettier-plugin-solidity";
import { SourceUnit } from "solidity-parser-antlr";

export class Printer {
  constructor(private ast: SourceUnit) {}

  public print() {
    const { ast } = this;

    // Yes, yes. This is ridiculous. But go and try and write
    // an AST to code writer and then tell me it's ridiculous.
    let code = prettier.format("<code>", {
      parser(_, parsers, options) {
        // The types on this library don't account for Options.printer,
        // so we'll ask the typechecker to ignore this one, as it errors.
        //
        // @ts-ignore
        options.printer = printers["solidity-ast"];
        return ast;
      },
    });

    // Fix some weird cases with the library.
    code = code.replace(/;\)/gm, ")");
    code = code.replace(/;;/gm, ";");

    return code;
  }
}
