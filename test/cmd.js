var Embark = require('../lib/index');
var Cmd = require('../lib/cmd');

describe('embark.Cmd', function () {
  this.timeout(0);
  var cmd = new Cmd(Embark);
  describe('#new', function () {
    it('it should not create an app without a name', function (done) {
      cmd.newApp(undefined, function (output) {
        var lines = output.split('\n');
        assert.equal(lines[0], 'please specify your app Name');
        assert.equal(lines[1], 'e.g embark new MyApp');
        assert.equal(lines[2], 'e.g embark new --help for more information');
      });
      done();
    });

    it('it should create an app with a name', function (done) {
      var appname = 'deleteapp';
      cmd.newApp(appname, function (output) {
        var lines = output.split('\n');
        assert.equal(lines[0], 'Initializing Embark Template....');
        assert.equal(lines[1], 'Installing packages.. this can take a few seconds');
        assert.equal(lines[2], 'Init complete');
        assert.equal(lines[3], 'App ready at ./' + appname);
      });
      done();
    });
  });

  // describe("#help", function () {
  //   it('it should spit out helpful text if no arguments are supplied', function (done) {
  //     cmd.process([], function (output) {
  //       var lines = output.split('\n');
  //       assert.equal(lines[0], '\n');
  //       assert.equal(lines[1], 'Usage:');
  //       done();
  //     });
  //   })
  // })
});