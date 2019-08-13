const async = require("async");
const fs = require("fs");

const {
  File,
  Types
} = require("embark-utils");

const SOLIDITY_TEST_MATCH = /^.+_test\.sol$/i;
const PRAGMA_MATCH = /^pragma solidity (.*);$/mi;
const LIBRARY_NAME_MATCH = /remix_tests\.sol/i;
const IMPORT_REMIX_TESTS_STMT = `
// - INJECTED BY EMBARK -
import "remix_tests.sol";
// ----------------------
`;

class SolidityTestRunner {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;

    this.files = new Set();

    this.events.request("tests:runner:register",
                        "Solidity",
                        this.match.bind(this),
                        this.addFile.bind(this),
                        this.run.bind(this));
  }

  addFile(path) {
    if (!this.match(path)) {
      throw new Error(`invalid Solidity test path: ${path}`);
    }

    this.files.add(path);
  }

  match(path) {
    return SOLIDITY_TEST_MATCH.test(path);
  }

  run() {
    const {events} = this;

    let web3;
    let contractFiles = [];
    let compiledContracts = [];

    this.files.forEach(f => {
      const resolver = (cb) => {
        fs.readFile(file, (err, data) => { cb(data.toString()); });
      };

      const file = new File({
        path: f,
        originalPath: f,
        type: Types.dappFile,
        resolver
      });

      contractFiles.add(file);
    });

    async.waterfall([
      (next) => {
        events.request("compiler:contracts:compile", contractFiles, next);
      },
      (cc, next) => {
        events.request("contracts:build", {}, cc, next);
      },
      (contractsList, contractsDeps, next) => {
        events.request("deployment:contracts:deploy", contractsList, contractDeps, next);
      },
      (next) => {
        events.request("blockchain:client:provider", "ethereum", next);
      },
      (bcProvider, next) => {
        web3 = new Web3(bcProvider);
      },

    ]);
  }

  prepare(contents) {
    if (LIBRARY_NAME_MATCH.test(contents)) {
      return contents;
    }

    const start = contents.search(PRAGMA_MATCH);
    const offset = contents.indexOf("\n", start);

    // Here we offset the offset + 1 so that it doesn't double newline.
    return contents.slice(0, offset) + IMPORT_REMIX_TESTS_STMT + contents.slice(offset + 1, contents.length);
  }
}

module.exports = SolidityTestRunner;
