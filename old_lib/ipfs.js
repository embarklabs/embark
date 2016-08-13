require('shelljs/global');

ipfs = function(build_dir) {
  ipfs_bin = exec('which ipfs').output.split("\n")[0]

  if (ipfs_bin==='ipfs not found'){
    console.log('=== WARNING: IPFS not in an executable path. Guessing ~/go/bin/ipfs for path')
    ipfs_bin = "~/go/bin/ipfs";
  }

  cmd = ipfs_bin + " add -r " + build_dir;

  console.log("=== adding " + cmd + " to ipfs");

  result = exec(cmd);

  rows = result.output.split("\n");

  dir_row = rows[rows.length - 2];

  dir_hash = dir_row.split(" ")[1];

  console.log("=== DApp available at http://localhost:8080/ipfs/" + dir_hash + "/");

  console.log("=== DApp available at http://gateway.ipfs.io/ipfs/" + dir_hash + "/");
}

Release = {
  ipfs: ipfs
}

module.exports = Release

