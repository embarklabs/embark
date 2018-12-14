/*globals describe, it*/
const assert = require('assert');

// TODO: need to rethink i18n and how that is required in each module
require('../../../lib/core/i18n/i18n');

const Compiler = require('../../../lib/modules/compiler');
const File = require('../../../lib/core/file.js');
const Plugins = require('../../../lib/core/plugins.js');
const TestLogger = require('../../../lib/utils/test_logger');
const Events = require('../../../lib/core/events');

const readFile = function(file) {
  return new File({filename: file, type: File.types.dapp_file, path: file});
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
        readFile('dist/test/contracts/simple_storage.sol'),
        readFile('dist/test/contracts/token.sol'),
        readFile('dist/test/contracts/erc20.vy')
      ], {}, (err, compiledObject) => {
        assert.deepEqual(compiledObject, { contractA: 'solResult', contractB: 'vyResult' })
        done();
      })

    })
  })

});
