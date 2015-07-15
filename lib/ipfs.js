require('shelljs/global');

ipfs = function(build_dir) {
  ipfs_path = "~/go/bin";

  cmd = ipfs_path + "/ipfs add -r " + build_dir;

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

