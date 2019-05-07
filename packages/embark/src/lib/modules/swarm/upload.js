import { __ } from 'embark-i18n';
require('colors');
let async = require('async');

class Swarm {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.swarm = options.swarm;
    this.providerUrl = options.providerUrl;
    this.env = options.env;
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
        if(self.env === 'development') {
          console.log(("\n=== " +
            "Blockchain must be running".bold +
            " ===").yellow);
          console.log((
            "embark run".italic +
            __(" or ") +
            "embark blockchain".italic +
            __(" must be running when the site is loaded to interact with the blockchain.\n")
          ).yellow);
          console.log(("=== " +
            "Usage with the public gateway".bold +
            " ===").yellow);
          console.log((
            __("If you wish to load your development site from the public gateway (swarm-gateways.net), you will need to first update your CORS settings (") +
            "config/blockchain.js > wsOrigins".italic +
            __(" and ") +
            "config/blockchain.js > rpcCorsDomain".italic +
            __(") to allow ") +
            "swarm-gateways.net".underline +
            __(". If these were set to 'auto', they would now need to be set to ") +
            "https://swarm-gateways.net,http://localhost:8000,http://localhost:8500,embark".underline +
            ".\n").yellow);
        }

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
