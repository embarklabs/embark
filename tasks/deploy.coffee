module.exports = (grunt) ->
  web3 = require('web3')
  readYaml = require('read-yaml');

  grunt.registerTask "deploy_contracts", "deploy code", (env)  =>
    blockchainConfig = readYaml.sync("config/blockchain.yml")
    contractsConfig  = readYaml.sync("config/contracts.yml")[env || "development"]
    rpcHost   = blockchainConfig[env || "development"].rpc_host
    rpcPort   = blockchainConfig[env || "development"].rpc_port
    gasLimit  = blockchainConfig[env || "development"].gas_limit || 500000
    gasPrice  = blockchainConfig[env || "development"].gas_price || 10000000000000

    try
      web3.setProvider(new web3.providers.HttpProvider("http://#{rpcHost}:#{rpcPort}"))
      primaryAddress = web3.eth.coinbase
      web3.eth.defaultAccount = primaryAddress
    catch e
      grunt.log.writeln("==== can't connect to #{rpcHost}:#{rpcPort} check if an ethereum node is running")
      exit

    grunt.log.writeln("address is : #{primaryAddress}")

    result  = "web3.setProvider(new web3.providers.HttpProvider('http://#{rpcHost}:#{rpcPort}'));"
    result += "web3.eth.defaultAccount = web3.eth.accounts[0];"

    contractDependencies = {}
    if contractsConfig?
      for className, options of contractsConfig
        continue unless options.args?
        for arg in options.args
          if arg[0] is "$"
            if contractDependencies[className] is undefined
              contractDependencies[className] = []
            contractDependencies[className].push(arg.substr(1))

    all_contracts = []
    contractDB = {}

    contractFiles = grunt.file.expand(grunt.config.get("deploy.contracts"))
    for contractFile in contractFiles
      source = grunt.file.read(contractFile)

      grunt.log.writeln("deploying #{contractFile}")
      compiled_contracts = web3.eth.compile.solidity(source)

      for className, contract of compiled_contracts
        all_contracts.push(className)
        contractDB[className] = contract

    all_contracts.sort (a,b) =>
      contract_1 = contractDependencies[a]
      contract_2 = contractDependencies[b]

      if a in contract_1 and b in contract_2
        grunt.log.writeln("looks like you have a circular dependency between #{a} and #{b}")
        exit
      else if b in contract_1
        1
      else if a in contract_2
        -1
      else
        0

    deployedContracts = {}

    for className in all_contracts
      contract = contractDB[className]
      contractGasLimit = contractsConfig?[className]?.gasLimit || gasLimit
      contractGasPrice = contractsConfig?[className]?.gasPrice || gasPrice

      args = contractsConfig?[className]?.args || []

      contractObject = web3.eth.contract(contract.info.abiDefinition)

      realArgs = []

      for arg in args
        if arg[0] is "$"
          realArgs.push(deployedContracts[arg.substr(1)])
        else
          realArgs.push(arg)

      contractParams = realArgs
      contractParams.push({from: primaryAddress, data: contract.code, gas: contractGasLimit, gasPrice: contractGasPrice})
      contractAddress = contractObject.new.apply(contractObject, contractParams).address
      deployedContracts[className] = contractAddress

      console.log "address is #{contractAddress}"

      grunt.log.writeln("deployed #{className} at #{contractAddress}")

      abi = JSON.stringify(contract.info.abiDefinition)

      result += "var #{className}Abi = #{abi};"
      result += "var #{className}Contract = web3.eth.contract(#{className}Abi);"
      result += "var #{className} = #{className}Contract.at('#{contractAddress}');";

    destFile = grunt.config.get("deploy.dest")
    grunt.file.write(destFile, result)

