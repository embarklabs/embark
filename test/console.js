/*globals describe, it*/
let Console = require('../lib/modules/console/');
let Plugins = require('../lib/core/plugins.js');
let IPC = require('../lib/core/ipc.js');
let assert = require('assert');
let version = require('../package.json').version;

describe('embark.Console', function() {
  let ipc = new IPC({ipcRole: 'none'});
  let plugins = new Plugins({plugins: {}});
  let events = {once: () => {}, setCommandHandler: () => {}, emit: () => {}};
  let console = new Console({}, {plugins, version, ipc, events});

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
