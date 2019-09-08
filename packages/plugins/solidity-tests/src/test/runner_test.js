/* globals beforeEach, describe, it */
const assert = require("assert").strict;
const sinon = require("sinon");

const fs = require("fs");
const os = require("os");
const path = require("path");
process.env.DAPP_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'embark-test-'));

const SolidityTestRunner = require("../lib");

const validFiles = [
  "SOME_UPPERCASE_TEST.sol",
  "other_uppercase_test.SOL",
  "some_file_test.sol",
  "file_with/path_test.sol",
  "c:\projects\cool-dapp\test\escrow_test.sol"
];

const invalidFiles = [
  "escrow.sol",
  "tricky.sol.js",
  "somesol.js",
  "c:\projects\cool-dapp\file.sol\test_file.md"
];

const cleanCode = (code) => {
  return code
    .trim()
    .split("\n")
    .map(l => l.replace(/^\s+/, ''))
    .join("\n");
};

describe("SolidityTestRunner", () => {
  let embark;
  let options;

  beforeEach(() => {
    const events = { request: sinon.spy() };
    embark = { events: events };
    options = {};
  });

  describe("constructor", () => {
    it("registers the runner", () => {
      const _ = new SolidityTestRunner(embark, options);
      assert(embark.events.request.called);
    });
  });

  describe("methods", () => {
    let instance;

    beforeEach(() => { instance = new SolidityTestRunner(embark, options); });

    describe("match", () => {
      it("matches .sol files", () => {
        validFiles.forEach(f => {
          assert(instance.match(f), `didn't match ${f} when it should`);
        });
      });

      it("doesn't match non .sol files", () => {
        invalidFiles.forEach(f => {
          assert(!instance.match(f), `matched ${f} when it shouldn't`);
        });
      });
    });

    describe("prepare", () => {
      it("doesn't mutate code with the import statement", () => {
        const code = cleanCode(`
          pragma solidity ^0.4.24;
          import "remix_tests.sol";
          import "escrow.sol";
          contract Foo {}
        `);

        const modified = instance.prepare(code);
        assert.equal(code, modified);
      });

      it("mutates code without the import statement", () => {
        const code = cleanCode(`
          pragma solidity ^0.4.24;
          import "escrow.sol";
          contract Foo {}
        `);

        const wanted = cleanCode(`
          pragma solidity ^0.4.24;
          // - INJECTED BY EMBARK -
          import "remix_tests.sol";
          // ----------------------
          import "escrow.sol";
          contract Foo {}
        `);

        const modified = instance.prepare(code);
        assert.equal(wanted, modified);
      });
    });

    describe("addFile", () => {
      it("throws an exception with invalid files", () => {
        invalidFiles.forEach(f => {
          assert.throws(() => { instance.addFile(f); });
        });
      });

      it("remembers files that are added", () => {
        validFiles.forEach(f => instance.addFile(f));
        assert.deepEqual(instance.files, [...new Set(validFiles)]);
      });
    });

    describe("run", () => {

    });
  });
});
