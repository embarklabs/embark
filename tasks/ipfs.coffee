module.exports = (grunt) ->

  grunt.registerTask "ipfs", "distribute into ipfs", (env_)  =>
    env = env_ || "development"
    Embark = require('embark-framework')
    Embark.release.ipfs("dist/dapp/")

