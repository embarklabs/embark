require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.bzz = options.bzz;
    this.storageConfig = options.storageConfig;
  }

  deploy() {
    return new Promise((resolve, reject) => {
      console.log("deploying to swarm!");
      let self = this;
      let bzz = this.bzz;
      async.waterfall([
        function runCommand(callback) {
          console.log(("=== adding " + self.buildDir + " to swarm").green);
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
          console.log((`=== DApp available at ${self.storageConfig.getUrl}${dir_hash}/`).green);

          callback();
        }
      ], function (err, _result) {
        if (err) {
          console.log("error uploading to swarm".red);
          console.log(err);
          return reject(err);
        }
        resolve('successfully uploaded to swarm');
      });
    });
  }
}

module.exports = Swarm;
