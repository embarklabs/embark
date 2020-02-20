/* global describe it */

import { Events, Plugins, TestLogger } from 'embark-core';
import { File, Types } from "embark-utils";
import findUp from 'find-up';

const assert = require('assert');

import Compiler from 'embark-compiler';

const readFile = function(file) {
  return new File({filename: file, type: Types.dappFile, path: file});
};

// will need refactor if we some day switch back to specifying version ranges
const currentSolcVersion = require(findUp.sync(
  'node_modules/embark-solidity/package.json',
  {cwd: __dirname}
)).dependencies.solc;
const TestEvents = {
  request: (cmd, cb) => {
    cb(currentSolcVersion);
  },
  emit: (_ev, _data) => {}
};

describe('embark.Compiler', function() {
  this.timeout(0);

  describe('command: compiler:contracts', function() {
    let plugins = new Plugins({
      logger: new TestLogger({}),
      events: TestEvents,
      config: {
        contractDirectories: ['app/contracts/'],
        embarkConfig: {
          options: {
            solc: {
              "optimize": true,
              "optimize-runs": 200
            }
          }
        }
      }
    });

    plugins.createPlugin("sol", {}).registerCompiler(".sol", (_matchingFiles, options, cb) => { return cb(null, {contractA: "solResult"}); });
    plugins.createPlugin("vyp", {}).registerCompiler(".vy",  (_matchingFiles, options, cb) => { return cb(null, {contractB: "vyResult"}); });

    const events = new Events();
    const embarkObject = {
      registerAPICall: () => {},
      events: events,
      logger: plugins.logger,
      embarkConfig: {
        options: {
          solc: {
            "optimize": true,
            "optimize-runs": 200
          }
        }
      }
    };

    // eslint-disable-next-line no-unused-vars
    const compiler = new Compiler(embarkObject, {plugins: plugins});

    it("should return aggregated result", (done) => {
      events.request("compiler:contracts:compile", [
        readFile('contracts/simple_storage.sol'),
        readFile('contracts/token.sol'),
        readFile('contracts/erc20.vy')
      ], (err, compiledObject) => {
        assert.deepEqual(compiledObject, { contractA: 'solResult', contractB: 'vyResult' });
        done();
      });

    });
  });

});
