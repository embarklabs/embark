const utils = require('web3-utils');

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// generates random inputs based on the inputs of an ABI
class ContractFuzzer {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
  }

  // main function to call, takes in iteration number and a contract and returns a map object
  // composed of method names -> fuzzed inputs.
  generateFuzz(iterations, contract) {
    const self = this;
    let fuzzMap = {};
    contract.abiDefinition.filter((x) => x.inputs && x.inputs.length !== 0 && x.type !== "event").forEach((abiMethod) => {
      let name = abiMethod.type === "constructor" ? "constructor" : abiMethod.name;
      let inputTypes = abiMethod.inputs.map(input => input.type);
      fuzzMap[name] = {};
      for (let i = 0; i < iterations; i++) {
        fuzzMap[name][i] = inputTypes.map(input => this.getTypeFuzz(input));
        self.logger.trace(name);
        self.logger.trace("iteration: " + i + "\n" + fuzzMap[name][i]);
      }
    });
    self.logger.trace('\n');
    return fuzzMap;
  }

  getTypeFuzz(typeString) {
    const self = this;
    // Group 0: uint256[3]
    // Group 1: uint256
    // Group 2: uint
    // Group 3: 256
    // Group 4: [3]
    // Group 5: 3
    let regexObj = typeString.match(/((bool|int|uint|bytes|string|address)([0-9]*)?)(\[([0-9]*)\])*$/);
    let type = regexObj[1];
    let kind = regexObj[2];
    let size = regexObj[3];
    let array = regexObj[4];
    let arraySize = regexObj[5];
    switch(true) {
      case array !== undefined: {
        // if it's a dynamic array pick a number between 1 and 256 for length of array
        let length = arraySize === undefined || arraySize === null || arraySize === '' ? Math.floor((Math.random() * 256) + 1)  : arraySize;
        return self.generateArrayOfType(length, type);
      }
      case kind === "bool":
        return self.generateRandomBool();
      case kind === "uint" || kind === "int":
        return self.generateRandomInt(size || 256);
      case kind === "bytes":
        return self.generateRandomStaticBytes(size || 32);
      case kind === "string":
        return self.generateRandomDynamicType();
      case kind === "address":
        return self.generateRandomAddress();
      default:
        throw new Error("Couldn't find proper ethereum abi type");
    }
  }

  generateRandomBool() {
    return sample([true, false]);
  }

  generateArrayOfType(length, type) {
    var arr = [];
    for (var i = 0; i < length; i++) arr.push(this.getTypeFuzz(type));
    return arr;
  }

  generateRandomDynamicType() {
    return Math.random().toString(36).slice(2);
  }

  generateRandomStaticBytes(size) {
    return utils.randomHex(parseInt(size, 10));
  }

  generateRandomInt(size) {
    return utils.toBN(utils.randomHex(parseInt(size, 10) / 8)).toString();
  }

  generateRandomAddress() {
    return utils.randomHex(20);
  }
}

module.exports = ContractFuzzer;
