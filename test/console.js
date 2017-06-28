/*globals describe, it*/
let Console = require('../lib/dashboard/console.js');
let Plugins = require('../lib/core/plugins.js');
let assert = require('assert');
let version = require('../package.json').version;

describe('embark.Console', function() {
  let plugins = new Plugins({plugins: {}});
  let console = new Console({plugins: plugins, version: version});

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('it should provide a help text', function(done) {
        console.executeCmd('help', function(output) {
          let lines = output.split('\n');
          assert.equal(lines[0], 'Welcome to Embark ' + version);
          assert.equal(lines[2], 'possible commands are:');
          done();
        });
      });
    });
  });
});
