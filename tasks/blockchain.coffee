module.exports = (grunt) ->

  grunt.registerTask "blockchain", "deploy ethereum node", (env_)  =>
    env = env_ || "development"
    Embark = require('embark-framework')
    Embark.Blockchain.startChain(env)

