module.exports = (grunt) ->
  web3 = require('web3')
  readYaml = require('read-yaml');

  grunt.registerTask "deploy_contracts", "deploy code", (env)  =>
    blockchainConfig = readYaml.sync("config/blockchain.yml")
    contractsConfig  = readYaml.sync("config/contracts.yml")[env || "development"]
    rpcHost   = blockchainConfig[env || "development"].rpc_host
    rpcPort   = blockchainConfig[env || "development"].rpc_port
    gasLimit  = blockchainConfig[env || "development"].gas_limit || 100000
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

    contractFiles = grunt.file.expand(grunt.config.get("deploy.contracts"))
    for contractFile in contractFiles
      source = grunt.file.read(contractFile)

      grunt.log.writeln("deploying #{contractFile}")
      compiled_contracts = web3.eth.compile.solidity(source)

      for className, contract of compiled_contracts
        contractGasLimit = contractsConfig[className].gasLimit || gasLimit
        contractGasPrice = contractsConfig[className].gasPrice || gasPrice

        args = contractsConfig[className].args

        contractObject = web3.eth.contract(contract.info.abiDefinition)
        #contractAddress = web3.eth.sendTransaction({from: primaryAddress, data: contract.code, gas: contractGasLimit, gasPrice: contractGasPrice})
        #contractAddress = contractObject.new(150, {from: primaryAddress, data: contract.code, gas: contractGasLimit, gasPrice: contractGasPrice}).address
        contractAddress = contractObject.new.apply(contractObject, [args, {from: primaryAddress, data: contract.code, gas: contractGasLimit, gasPrice: contractGasPrice}]).address

        if (web3.eth.getCode(contractAddress) is "0x") {
          console.log "contract #{className} was not deployed, try adjusting the gas costs"
          exit
        }

        console.log "address is #{contractAddress}"

        grunt.log.writeln("deployed #{className} at #{contractAddress}")

        abi = JSON.stringify(contract.info.abiDefinition)

        result += "var #{className}Abi = #{abi};"
        result += "var #{className}Contract = web3.eth.contract(#{className}Abi);"
        result += "var #{className} = #{className}Contract.at('#{contractAddress}');";

    destFile = grunt.config.get("deploy.dest")
    grunt.file.write(destFile, result)

