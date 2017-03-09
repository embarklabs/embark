var Embark = require('../lib/index');
var Cmd = require('../lib/cmd');

var passingLines = function () {
  var lines = [];
  lines.push('Initializing Embark Template....');
  lines.push('Installing packages.. this can take a few seconds');
  lines.push('Init complete');
  return lines;
};

describe('embark.Cmd', function () {
  var cmd = new Cmd(Embark);
  var pl = passingLines();
  var appname = 'deleteapp';

  describe('#new', function () {
    this.timeout(0);
    it('it should create an app with a `name` argument set', function (done) {
      cmd.newApp(appname, function (output) {
        var lines = output.split('\n');
        console.log(lines);
        assert.equal(lines[0], pl[0]);
        assert.equal(lines[1], pl[1]);
        assert.equal(lines[2], pl[2]);
        assert.equal(lines[3], 'App ready at ./' + appname);
        done();
      });
    });

    it('it should prompt when given an empty app name', function (done) {
      cmd.newApp(undefined, function (output) {
        var lines = output.split('\n');
        console.log(lines);
        process.stdout.write(appname);
        assert.equal(lines[0], pl[0]);
        done();
      });
    });

  });
});