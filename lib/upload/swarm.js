var colors = require('colors');
var async = require('async');
var shelljs = require('shelljs');

var Swarm = function(options) {
  this.options = options;
  this.buildDir = options.buildDir || 'dist/';
};

Swarm.prototype.deploy = function() {
  var self = this;
  async.waterfall([
    function findBinary(callback) {
      var swarm_bin = shelljs.exec('which swarm').output.split("\n")[0];

      if (swarm_bin==='swarm not found' || swarm_bin === ''){
        console.log('=== WARNING: Swarm not in an executable path. Guessing ~/go/bin/swarm for path'.yellow);
        swarm_bin = "~/go/bin/swarm";
      }

      return callback(null, swarm_bin);
    },
    function runCommand(swarm_bin, callback) {
      var cmd = swarm_bin + " --defaultpath " + self.buildDir + "index.html --recursive up " + self.buildDir;
      console.log(("=== adding " + self.buildDir + " to swarm").green);
      console.log(cmd.green);
      var result = shelljs.exec(cmd);

      return callback(null, result);
    },
    function getHashFromOutput(result, callback) {
      if (result.code !== 0) {
        return callback("couldn't upload, is the swarm daemon running?");
      }

      var rows = result.output.split("\n");
      var dir_hash = rows.reverse()[1];

      return callback(null, dir_hash);
    },
    function printUrls(dir_hash, callback) {
      console.log(("=== DApp available at http://localhost:8500/bzz:/" + dir_hash + "/").green);

      return callback();
    }
  ], function(err, result) {
      if (err) {
        console.log("error uploading to swarm".red);
        console.log(err);
      }
  });
};

module.exports = Swarm;

