import { __ } from 'embark-i18n';
require('colors');
let async = require('async');
let shelljs = require('shelljs');

const path = require('path');

class IPFS {
  constructor(options) {
    this.options = options;
    this.buildDir = options.buildDir || 'dist/';
    this.storageConfig = options.storageConfig;
    this.configIpfsBin = this.storageConfig.ipfs_bin || "ipfs";
    this.env = options.env;
  }

  deploy(cb) {
    console.log("deploying to ipfs!");
    let self = this;
    async.waterfall([
      function findBinary(callback) {
        let ipfs_bin = shelljs.which(self.configIpfsBin);

        if (ipfs_bin === 'ipfs not found' || !ipfs_bin) {
          console.log(('=== WARNING: ' + self.configIpfsBin + ' ' + __('not found or not in the path. Guessing %s for path', '~/go/bin/ipfs')).yellow);
          ipfs_bin = "~/go/bin/ipfs";
        }

        callback(null, ipfs_bin);
      },
      function runCommand(ipfs_bin, callback) {
        let cmd = `"${ipfs_bin}" add -r ${self.buildDir}`;
        console.log(("=== " + __("adding %s to ipfs", self.buildDir)).green);
        console.debug(cmd);
        shelljs.exec(cmd, {silent:true}, function(code, stdout, stderr){ // {silent:true}: don't echo cmd output so it can be controlled via logLevel
          console.log(stdout.green);
          if (code) {
            // stderr can sometimes be an error or the total uploaded size
            return callback(stderr || __('IPFS exited with code %s', code.toString()));
          }
          callback(null, stdout);
        });
      },
      function getHashFromOutput(result, callback) {
        const pattern = `added ([a-zA-Z1-9]{46}) ${path.basename(self.buildDir)}\n`;
        const regex = RegExp(pattern, 'm');
        const dirHash = result.match(regex)[1];

        callback(null, dirHash);
      },
      function printUrls(dir_hash, callback) {
        console.log(("=== " + __("DApp available at") + " http://localhost:8080/ipfs/" + dir_hash + "/").green);
        console.log(("=== " + __("DApp available at") + " https://ipfs.infura.io/ipfs/" + dir_hash + "/").green);
        console.log(("=== " + __("DApp available at") + " https://gateway.ipfs.io/ipfs/" + dir_hash + "/").green);
        console.log(("=== " + __("DApp available at") + " https://cloudflare-ipfs.com/ipfs/" + dir_hash + "/").green);
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
            __("If you wish to load your development site from the public gateway (ipfs.infura.io), you will need to first update your CORS settings (") +
            "config/blockchain.js > wsOrigins".italic +
            __(" and ") +
            "config/blockchain.js > rpcCorsDomain".italic +
            __(") to allow ") +
            "ipfs.infura.io".underline +
            __(". If these were set to 'auto', they would now need to be set to ") +
            "https://ipfs.infura.io,http://localhost:8000,http://localhost:8500,embark".underline +
            ".\n").yellow);
        }

        callback(null, dir_hash);
      }
    ], function (err, dir_hash) {
      if (err) {
        console.error(__("error uploading to ipfs").red);
        cb(err);
      }
      else cb(null, dir_hash);
    });
  }
}

module.exports = IPFS;
