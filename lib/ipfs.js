var colors = require('colors');

var IPFS = function(options) {
  this.options = options;
  this.buildDir = options.buildDir || 'dist/';
};

IPFS.prototype.deploy = function() {
  var ipfs_bin = exec('which ipfs').output.split("\n")[0];

  if (ipfs_bin==='ipfs not found'){
    console.log('=== WARNING: IPFS not in an executable path. Guessing ~/go/bin/ipfs for path'.yellow);
    ipfs_bin = "~/go/bin/ipfs";
  }

  var cmd = ipfs_bin + " add -r " + build_dir;
  console.log(("=== adding " + cmd + " to ipfs").green);

  var result = exec(cmd);
  var rows = result.output.split("\n");
  var dir_row = rows[rows.length - 2];
  var dir_hash = dir_row.split(" ")[1];

  console.log(("=== DApp available at http://localhost:8080/ipfs/" + dir_hash + "/").green);
  console.log(("=== DApp available at http://gateway.ipfs.io/ipfs/" + dir_hash + "/").green);
};

module.exports = IPFS;

