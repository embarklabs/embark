/*globals describe, it*/
var Console = require('../lib/console.js');
var Plugins = require('../lib/plugins.js');
var assert = require('assert');

describe('embark.Console', function() {
  var plugins = new Plugins({plugins: {}});
  var console = new Console({plugins: plugins});

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('it should provide a help text', function(done) {
        console.executeCmd('help', function(output) {
          var lines = output.split('\n');
          assert.equal(lines[0], 'Welcome to Embark 2');
          assert.equal(lines[2], 'possible commands are:');
          done();
        });
      });
    });
  });
});
