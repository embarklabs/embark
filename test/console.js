/*globals describe, it*/
var Console = require('../lib/dashboard/console.js');
var Plugins = require('../lib/core/plugins.js');
var assert = require('assert');

describe('embark.Console', function() {
  var plugins = new Plugins({plugins: {}});
  var console = new Console({plugins: plugins, version: '2.3.1'});

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('it should provide a help text', function(done) {
        console.executeCmd('help', function(output) {
          var lines = output.split('\n');
          assert.equal(lines[0], 'Welcome to Embark 2.3.1');
          assert.equal(lines[2], 'possible commands are:');
          done();
        });
      });
    });
  });
});
