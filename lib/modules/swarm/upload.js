require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
  }

  deploy(deployOptions) {
    return new Promise((resolve, reject) => {
      console.log("deploying to swarm!");
      let self = this;
      let web3 = (deployOptions || {}).web3;
      async.waterfall([
        function findWeb3(callback){
          if(!web3){
            callback('web3 must be passed in to the swarm deploy() method');
          }else callback();
        },
        function setProvider(callback){
          web3.bzz.setProvider(`http://${self.options.storageConfig.host}:${self.options.storageConfig.port}`);
          callback();
        },
        function runCommand(callback) {
          console.log(("=== adding " + self.buildDir + " to swarm").green);
          web3.bzz.upload({
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
          console.log((`=== DApp available at ${self.options.storageConfig.getUrl}${dir_hash}/`).green);

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
