var Embark = require('../lib/index');
var Cmd = require('../lib/cmd');

// Function to send a line to stdin
function sendLine(line) {
  setImmediate(function () {
    process.stdin.emit('data', line + '\n');
  });
}

var passingLines = function () {
  var lines = [];
  lines.push('Initializing Embark Template....');
  lines.push('Installing packages.. this can take a few seconds');
  lines.push('Init complete');
  return lines;
};

describe('embark.Cmd', function () {
  this.timeout(0);

  describe('#new', function () {
    it('it should create an app with a name', function (done) {
      var cmd = new Cmd(Embark);
      var pl = passingLines();
      var appname = 'deleteapp';
      cmd.newApp(appname, function (output) {
        var lines = output.split('\n');
        console.log(lines);
        assert.equal(lines[0], pl[0]);
        assert.equal(lines[1], pl[1]);
        assert.equal(lines[2], pl[2]);
        assert.equal(lines[3], 'App ready at ./' + appname);
       });
      done();
    });

    it('it should prompt when given an empty app name', function (done) {
      var cmd = new Cmd(Embark);
      var pl = passingLines();
      var appname = 'deleteapp';

      cmd.newApp(undefined, function (output) {
        var lines = output.split('\n');
        console.log(lines);
        sendLine(appname + '\n');
        assert.equal(lines[0], pl[0]);
      });
      done();
    });
  });
});