/* global describe it */

import assert from "assert";
import fs from "fs";
import path from "path";
import parser from "solidity-parser-antlr";

import { Printer } from "../lib/printer";

const FIXTURE_PATH = path.join(__dirname, "../", "../", "src", "test", "fixtures", "contracts");
const FIXTURES = fs.readdirSync(FIXTURE_PATH).map((f) => {
  const fp = path.join(FIXTURE_PATH, f);

  return {
    basename: f,
    path: fp,
    source: fs.readFileSync(fp, "utf8")
  };
});

describe("Printer", () => {
  describe("printing an AST", () => {
    describe("prints equivalent code", () => {
      for (const fixture of FIXTURES) {
        it(fixture.basename, () => {
          const astBefore = parser.parse(fixture.source, {loc: false, range: false});
          const printer = new Printer(astBefore);

          const source = printer.print();
          const astAfter = parser.parse(source, {loc: false, range: false});

          // Remove .tokens from the AST as it gets walked and processed by
          // prettier. This is not consequential for anything else. Also, the
          // tokens property is added without types, and as we can't remove it
          // without Typescript doing some type checks, we'll have to ask it to
          // ignore those here.
          //
          // @ts-ignore
          delete astBefore.tokens;

          assert.deepEqual(astBefore, astAfter);
        });
      }
    });
  });
});
