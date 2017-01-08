/*globals describe, it*/
var Console = require('../lib/console.js');
var assert = require('assert');

describe('embark.Console', function() {
  var console = new Console();

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('i should provide a help text', function(done) {
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
