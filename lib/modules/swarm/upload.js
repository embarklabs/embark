require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.bzz = options.bzz;
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
        console.log(("=== " + __("DApp available at") + ` https://swarm-gateways.net/bzz:/${dir_hash}`).green);

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
