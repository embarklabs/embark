/*globals describe, it*/
let Console = require('../lib/modules/console/');
let Plugins = require('../lib/core/plugins.js');
let IPC = require('../lib/core/ipc.js');
let assert = require('assert');
let version = require('../../package.json').version;

describe('embark.Console', function() {
  let ipc = new IPC({ipcRole: 'none'});
  let events = {once: () => {}, setCommandHandler: () => {}, emit: () => {}, on: () => {}};
  let plugins = new Plugins({plugins: {}, events: events});
  let embarkObject = {
    registerAPICall: () => {},
    events: events,
    logger: plugins.logger,
    registerConsoleCommand: (cmd, opt) => {},
    embarkConfig: {
      options: {
        solc: {
          "optimize": true,
          "optimize-runs": 200
        }
      }
    }
  }
  let console = new Console(embarkObject, {plugins, version, ipc, events});

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('it should provide a help text', function(done) {
        console.executeCmd('help', function(_err, output) {
          let lines = output.split('\n');
          assert.equal(lines[0], 'Welcome to Embark ' + version);
          assert.equal(lines[2], 'possible commands are:');
          done();
        });
      });
    });
  });
});
