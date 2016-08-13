var async = require('async');

// needs:
//  compile the contract -> file location
//  gas -> config
contractObject = {
  compiledCode,
  abiDefinition,
  gas,
  gasPrice
}

function deployContract(web3, contractObject, params) {
  var contractObject = web3.eth.contract(contract.compiled.info.abiDefinition);

  var contractParams = params;
  contractParams.push({
    from: primaryAddress,
    data: contract.compiled.code,
    gas: contract.gasLimit,
    gasPrice: contract.gasPrice
  });
  contractParams.push(callback);

  contractObject["new"].apply(contractObject, contractParams);
};

function buildContractObject(contractCode, gas, gasPrice) {
  var compiledContract = compiler.compile(contractCode);
  return {
  }
}

