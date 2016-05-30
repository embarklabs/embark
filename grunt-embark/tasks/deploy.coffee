module.exports = (grunt) ->

  grunt.registerTask "deploy_contracts", "deploy code", (env_)  ->
    env = env_ || "development"
    contractFiles = grunt.file.expand(grunt.config.get("deploy.contracts"));
    destFile = grunt.config.get("deploy.dest");

    Embark = require('embark-framework')
    Embark.init()
    Embark.blockchainConfig.loadConfigFile('config/blockchain.yml')
    Embark.contractsConfig.loadConfigFile('config/contracts.yml')

    chainFile = Embark.blockchainConfig.blockchainConfig[env].chains || './chains.json'

    deployed = false

    done = @async()
    Embark.deployContracts env, contractFiles, destFile, chainFile, true, true, (abi) =>
      grunt.file.write(destFile, abi)

      unless deployed
        deployed = true
        done()

