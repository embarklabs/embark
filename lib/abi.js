
var ABIGenerator = function(blockchainConfig, contractsManager) {
  this.blockchainConfig = blockchainConfig;
  this.contractsManager = contractsManager;
  this.rpcHost = blockchainConfig.rpcHost;
  this.rpcPort = blockchainConfig.rpcPort;
};

ABIGenerator.prototype.generateProvider = function() {
  var result = "";

  result += "\nif (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {";
  result += '\n\tweb3 = new Web3(web3.currentProvider);';
  result += "\n} else if (typeof Web3 !== 'undefined') {";
  result += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("http://' + this.rpcHost + ':' + this.rpcPort + '"));';
  result += '\n}';
  result += "\nweb3.eth.defaultAccount = web3.eth.accounts[0];";

  return result;
};

ABIGenerator.prototype.generateContracts = function(useEmbarkJS) {
  var result = "\n";

  for(var className in this.contractsManager.contracts) {
    var contract = this.contractsManager.contracts[className];

    var abi = JSON.stringify(contract.abiDefinition);

    if (useEmbarkJS) {
      result += "\n" + className + " = new EmbarkJS.Contract({abi: " + abi + ", address: '" + contract.deployedAddress + "', code: '" + contract.code + "'});";
    } else {
      result += "\n" + className + "Abi = " + abi + ";";
      result += "\n" + className + "Contract = web3.eth.contract(" + className + "Abi);";
      result += "\n" + className + " = " + className + "Contract.at('" + contract.deployedAddress + "');";
    }
  }

  return result;
};

ABIGenerator.prototype.generateABI = function(options) {
  var result = "";

  result += this.generateProvider();
  result += this.generateContracts(options.useEmbarkJS);

  return result;
};

module.exports = ABIGenerator;
