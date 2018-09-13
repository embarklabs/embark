require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.swarm = options.swarm;
    this.providerUrl = options.providerUrl;
  }

  deploy(cb) {
    console.log(__("deploying to swarm!"));
    const self = this;
    const swarm = this.swarm;
    async.waterfall([
      function runCommand(callback) {
        console.log(("=== " + __("adding %s to swarm", self.buildDir)).green);
        swarm.uploadDirectory(self.buildDir, 'index.html', callback);
      },
      function printUrls(dir_hash, callback) {
        if (!dir_hash) {
          return callback('No directory hash was returned');
        }
        console.log(("=== " + __("DApp available at") + ` ${self.providerUrl}/bzz:/${dir_hash}/index.html`).green);
        console.log(("=== " + __("DApp available at") + ` https://swarm-gateways.net/bzz:/${dir_hash}/index.html`).green);
        console.log(("=== " + __("NOTE: Swarm AND a blockchain node must be running for the dApp to work correctly (ie 'embark run')").yellow));

        callback(null, dir_hash);
      }
    ], function (err, dir_hash) {
      if (err) {
        console.log(__("error uploading to swarm").red);
        console.log(err);
        return cb(err);
      }
      cb(null, dir_hash);
    });
  }
}

module.exports = Swarm;
