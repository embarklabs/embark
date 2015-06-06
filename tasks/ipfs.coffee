module.exports = (grunt) ->
  require('shelljs/global')

  grunt.registerTask "ipfs", "distribute into ipfs", (env_)  =>
    env = env_ || "development"

    ipfs_path = "~/go/bin"
    build_dir = "dist/dapp/"
    cmd = "#{ipfs_path}/ipfs add -r #{build_dir}"

    grunt.log.writeln("=== adding #{cmd} to ipfs")
    result = exec(cmd)

    rows = result.output.split("\n")
    dir_row = rows[rows.length - 2]
    dir_hash = dir_row.split(" ")[1]

    grunt.log.writeln("=== DApp available at http://localhost:8080/ipfs/#{dir_hash}/")

