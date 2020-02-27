/* global describe it */

const assert = require('assert');

let Cmd = require('../cmd/cmd');

// Function to send a line to stdin
function sendLine(line) {
  setImmediate(function () {
    process.stdin.emit('data', line + '\n');
  });
}

let passingLines = function () {
  let lines = [];
  lines.push('Initializing Embark Template....');
  lines.push('Installing packages.. this can take a few seconds');
  lines.push('Init complete');
  return lines;
};

describe('embark.Cmd', function () {
  this.timeout(0);

  describe('#new', function () {
    it('it should create an app with a name', function (done) {
      let cmd = new Cmd({embarkConfig: {}});
      let pl = passingLines();
      let appname = 'deleteapp';
      cmd.newApp(appname, function (output) {
        let lines = output.split('\n');
        console.log(lines);
        assert.equal(lines[0], pl[0]);
        assert.equal(lines[1], pl[1]);
        assert.equal(lines[2], pl[2]);
        assert.equal(lines[3], 'App ready at ./' + appname);
       });
      done();
    });

    it('it should prompt when given an empty app name', function (done) {
      let cmd = new Cmd({embarkConfig: {}});
      let pl = passingLines();
      let appname = 'deleteapp';

      cmd.newApp(undefined, function (output) {
        let lines = output.split('\n');
        console.log(lines);
        sendLine(appname + '\n');
        assert.equal(lines[0], pl[0]);
      });
      done();
    });
  });
});
