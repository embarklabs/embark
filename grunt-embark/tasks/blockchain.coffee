module.exports = (grunt) ->

  grunt.registerTask "blockchain", "deploy ethereum node", (env_)  =>
    env = env_ || "development"
    Embark = require('embark-framework')
    Embark.init()
    Embark.blockchainConfig.loadConfigFile('config/blockchain.yml')
    Embark.startBlockchain(env)

