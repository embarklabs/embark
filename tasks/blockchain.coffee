module.exports = (grunt) ->
  readYaml = require('read-yaml')
  require('shelljs/global')

  grunt.registerTask "blockchain", "deploy ethereum node", (env_)  =>
    env = env_ || "development"
    try
      blockchainConfig = readYaml.sync("config/blockchain.yml")
    catch exception
      grunt.log.writeln("==== error reading config/blockchain.yml")
      grunt.log.writeln(exception)

    rpcHost      = blockchainConfig[env].rpc_host
    rpcPort      = blockchainConfig[env].rpc_port
    rpcWhitelist = blockchainConfig[env].rpc_whitelist

    minerthreads = blockchainConfig[env].minerthreads
    datadir      = blockchainConfig[env].datadir
    networkId    = blockchainConfig[env].network_id || Math.floor(((Math.random()*100000)+1000))
    port         = blockchainConfig[env].port || "30303"
    console          = blockchainConfig[env].console || false
    mine_when_needed = blockchainConfig[env].mine_when_needed || false

    account = blockchainConfig[env].account
    address = account.address

    cmd  = "geth "
    unless datadir is "default"
      cmd += "--datadir=\"#{datadir}\" "
      cmd += "--logfile=\"#{datadir}.log\" "
    cmd += "--port #{port} "
    cmd += "--rpc "
    cmd += "--rpcport #{rpcPort} "
    cmd += "--networkid #{networkId} "
    cmd += "--rpccorsdomain \"#{rpcWhitelist}\" "
    unless minerthreads is undefined
      cmd += "--minerthreads \"#{minerthreads}\" "
    cmd += "--mine "

    if account.password isnt undefined
      cmd += "--password #{account.password} "

    if account.init
      grunt.log.writeln("=== initializating account")

      grunt.log.writeln("running: #{cmd} account list")
      result = exec(cmd + "account list")
      grunt.log.writeln("finished")
      grunt.log.writeln("=== output is #{result.output}")
      if result.output.indexOf("Fatal") < 0
        grunt.log.writeln("=== already initialized")
        address = result.output.match(/{(\w+)}/)[1]
      else
        grunt.log.writeln("running: #{cmd} account new")
        output = exec(cmd + " account new")
        address = output.output.match(/{(\w+)}/)[1]

    if address isnt undefined
      cmd += "--unlock #{address} "

    if console
      cmd += "console"

    if mine_when_needed
      cmd += "js node_modules/embark-framework/js/mine.js"

    grunt.log.writeln("running: #{cmd}")
    grunt.log.writeln("=== running geth")
    #sh.run(cmd)
    exec(cmd)

