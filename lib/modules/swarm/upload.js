require('colors');
let async = require('async');
let shelljs = require('shelljs');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
  }

  deploy() {
    return new Promise((resolve, reject) => {
      let self = this;
      async.waterfall([
        function findBinary(callback) {
          let swarm_bin = shelljs.which('swarm');

          if (swarm_bin === 'swarm not found' || !swarm_bin) {
            console.log('=== WARNING: Swarm not in an executable path. Guessing ~/go/bin/swarm for path'.yellow);
            swarm_bin = "~/go/bin/swarm";
          }

          callback(null, swarm_bin);
        },
        function runCommand(swarm_bin, callback) {
          let cmd = `"${swarm_bin}" --defaultpath ${self.buildDir} index.html --recursive up ${self.buildDir}`;
          console.log(("=== adding " + self.buildDir + " to swarm").green);
          console.log(cmd.green);
          shelljs.exec(cmd, function(code, stdout, stderr){
            callback(stderr, {code: code, output: stdout});
          });
        },
        function getHashFromOutput(result, callback) {
          if (result.code !== 0) {
            callback("couldn't upload, is the swarm daemon running?");
          }
          else{
            let rows = result.output.split("\n");
            let dir_hash = rows.reverse()[1];

            callback(null, dir_hash);
          }
        },
        function printUrls(dir_hash, callback) {
          console.log(("=== DApp available at http://localhost:8500/bzz:/" + dir_hash + "/").green);

          callback();
        }
      ], function (err, _result) {
        if (err) {
          console.log("error uploading to swarm".red);
          console.log(err);
          reject(err);
        }
        else resolve('successfully uploaded to swarm');
      });
    });
  }
}

module.exports = Swarm;
