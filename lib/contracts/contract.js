class Contract {
  constructor(className, compiledContract, gas, gasPrice, type = 'file') {
    this.className = className;
    this.gas = gas;
    this.gasPrice = gasPrice;
    this.type = type;
    this.compiledContract = compiledContract;
  }

  set compiledContract(compiledContract) {
    this.code = compiledContract.code;
    this.runtimeBytecode = compiledContract.runtimeBytecode;
    this.realRuntimeBytecode = (contract.realRuntimeBytecode || contract.runtimeBytecode);
    this.swarmHash = compiledContract.swarmHash;
    this.gasEstimates = compiledContract.gasEstimates;
    this.functionHashes = compiledContract.functionHashes;
    this.abiDefinition = compiledContract.abiDefinition;
    this.filename = compiledContract.filename;
    this.originalFilename = compiledContract.originalFilename || ("contracts/" + contract.filename);
  }

}