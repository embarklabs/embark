const async = require("async");
const { dappPath } = require("embark-utils");
const remixTests = require('remix-tests');
const Web3 = require('web3');

const {
  File,
  Types
} = require("embark-utils");

const Reporter = require('./reporter');

const GAS_LIMIT = 6000000;
const SOLIDITY_TEST_MATCH = /^.+_test\.sol$/i;
const PRAGMA_MATCH = /^pragma solidity (.*);$/mi;
const LIBRARY_NAME_MATCH = /remix_tests\.sol/i;
const IMPORT_REMIX_TESTS_STMT = `
// - INJECTED BY EMBARK -
import "remix_tests.sol";
// ----------------------
`;
const ASSERT_LIB = new File({
  path: dappPath(".embark", "remix_tests.sol"),
  originalPath: dappPath(".embark", "remix_tests.sol"),
  type: Types.custom,
  resolver: (cb) => { cb(remixTests.assertLibCode); }
});

class SolidityTestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;
    this.fs = embark.fs;

    this.plugins = options.plugins;

    this.files = [];

    const {events} = embark;
    events.request("tests:runner:register",
                        "Solidity",
                        this.match.bind(this),
                        this.addFile.bind(this),
                        this.run.bind(this));
  }

  addFile(path) {
    if (!this.match(path)) {
      throw new Error(`invalid Solidity test path: ${path}`);
    }

    this.files.push(path);
  }

  match(path) {
    return SOLIDITY_TEST_MATCH.test(path);
  }

  run(options, cb) {
    const reporter = new Reporter(options.reporter);
    const {events, fs} = this;

    if (this.files.length === 0) {
      return cb(null, 0);
    }

    let web3;
    let contractsToDeploy = {};

    const resolverFn = (file) => {
      return (cb) => {
        fs.readFile(file, (_err, data) => {
          const code = data.toString();
          const injected = this.prepare(code);

          cb(injected);
        });
      };
    };

    const contractFiles = this.files.map(f => new File({path: f, originalPath: f, type: Types.custom, resolver: resolverFn(f)}));
    contractFiles.unshift(ASSERT_LIB);

    let allCompiledContracts = {};

    async.waterfall([
      (next) => {
        // write the remix_tests file where it will be found.
        fs.writeFile(ASSERT_LIB.originalPath, remixTests.assertLibCode, next);
      },
      (next) => {
        events.request("contracts:reset", next);
      },

      /*
      (next) => {
        plugins.emitAndRunActionsForEvent('tests:contracts:compile:before', contractFiles, next);
      },
      */
      (next) => {
        events.request("compiler:contracts:compile", contractFiles, next);
      },

      /*
      (cc, next) => {
        plugins.emitAndRunActionsForEvent('tests:contracts:compile:after', cc, next);
      },
      */
      (compiledContracts, next) => {
        allCompiledContracts = compiledContracts;
        // TODO: fetch config and use it here
        events.request("contracts:build", { contracts: {} }, compiledContracts, next);
      },
      (contractsList, contractDependencies, next) => {
        // Build the list of contracts we actually want to deploy
        contractsToDeploy = { Assert: contractsList['Assert'] };

        for(const contract in contractsList) {
          if (!this.match(contractsList[contract].path)) {
            continue;
          }

          contractsList[contract].gas = GAS_LIMIT;
          contractsToDeploy[contract] = contractsList[contract];
        }

        events.request("deployment:contracts:deploy", contractsToDeploy, contractDependencies, next);
      },
      (_result, next) => {
        events.emit('tests:ready');
        events.request("blockchain:client:provider", "ethereum", next);
      },
      (bcProvider, next) => {
        web3 = new Web3(bcProvider);
        web3.eth.getAccounts(next);
      },
      (accounts, next) => {
        const opts = { from: accounts[0] };
        const contracts = Object.keys(contractsToDeploy).filter(c => c !== "Assert");

        async.eachOfLimit(contracts, 1, (contract, _, cb) => {
          const instance = contractsToDeploy[contract];

          const contractObj = new web3.eth.Contract(
            instance.abiDefinition,
            instance.deployedAddress,
            opts
          );

          contractObj.filename = instance.originalFilename;
          contractObj.options.gas = 4000000;

          const details = {
            userdoc: { methods: [] },
            evm: { methodIdentifiers: instance.functionHashes }
          };

          const ast = allCompiledContracts[instance.className].ast;

          // TODO: temporary fix until this is fixed in remix-tests, remove this snippet when it is
          /*eslint max-depth: ["error", 5]*/
          if (ast.nodes && ast.nodes.length > 0) {
            for (let node of ast.nodes) {
              if (node.nodeType === 'ContractDefinition') {
                for (let subnode of node.nodes) {
                  if (subnode.nodeType === 'FunctionDefinition') {
                    subnode.kind = 'function';
                  }
                }
              }
            }
          }
          // TODO: temporary fix until this is fixed in remix-tests, remove this snippet when it is

          remixTests.runTest(contract, contractObj, details, ast, {accounts}, reporter.report.bind(reporter), cb);
        }, next);
      }
    ], cb);
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
