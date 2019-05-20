/*global describe, it, require*/
import { File, Types } from "embark-utils";

const assert = require('assert');

const Compiler = require('embark-compiler');
const Plugins = require('../../../lib/core/plugins.js');
const TestLogger = require('../../../lib/utils/test_logger');
const Events = require('../../../lib/core/events');

const readFile = function(file) {
  return new File({filename: file, type: Types.dappFile, path: file});
};

const currentSolcVersion = require('../../../../package.json').dependencies.solc;
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

    const compiler = new Compiler(embarkObject, {plugins: plugins});

    it("should return aggregated result", (done) => {
      events.request("compiler:contracts", [
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
