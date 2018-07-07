require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.bzz = options.bzz;
    this.storageConfig = options.storageConfig;
    this.getUrl = options.getUrl;
  }

  deploy(cb) {
    console.log(__("deploying to swarm!"));
    let self = this;
    let bzz = this.bzz;
    async.waterfall([
      function runCommand(callback) {
        console.log(("=== " + __("adding %s to swarm", self.buildDir)).green);
        bzz.upload({
          path: self.buildDir, // path to data / file / directory
          kind: "directory", // could also be "file" or "data"
          defaultFile: "index.html" // optional, and only for kind === "directory"
        })
          .then((success) => {
            callback(null, success);
          })
          .catch(callback);
      },
      function printUrls(dir_hash, callback) {
        if (!dir_hash) {
          return callback('No directory hash was returned');
        }
        console.log(("=== " + __("DApp available at") + ` ${self.getUrl}${dir_hash}/`).green);
        console.log(("=== " + __("DApp available at") + ` http://swarm-gateways.net/bzz:/${dir_hash}`).green);

        callback();
      }
    ], function (err, _result) {
      if (err) {
        console.log(__("error uploading to swarm").red);
        console.log(err);
        return cb(err);
      }
      cb(null, __('successfully uploaded to swarm'));
    });
  }
}

module.exports = Swarm;
