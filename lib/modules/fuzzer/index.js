const ethAbi = require('web3-eth-abi');
const utils = require('web3-utils');
const _ = require('underscore');


// generates random inputs based on the inputs of an ABI
class ContractFuzzer {
  constructor(embark) {
    //this.abi = abi;
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.registerConsoleCommand();
  }

  generateFuzz(iterations, contract) {
    let fuzz = [];
    for (let i = 0; i < iterations; i++)  
      contract.abiDefinition.forEach((abiMethod) => {
          let inputTypes = abiMethod.inputs.map(input => input.type);
          console.log("INPUT TYPES:", inputTypes);
          let fuzzedInputs = _.map(inputTypes, this.getTypeFuzz.bind(this));
          console.log("FUZZED INPUTS:", fuzzedInputs);
          //fuzz.push(ethAbi.encodeFunctionCall(abiMethod, fuzzedInputs));
          console.log("FUZZ SO FAR:", fuzz);
      });
    console.log("FUZZ:", fuzz);
    return fuzz;
  }

  getTypeFuzz(typeString) {
    const self = this;
    console.log("TYPE:", typeString);
    // Group 0: uint256[3]
    // Group 1: uint256
    // Group 2: uint
    // Group 3: 256
    // Group 4: [3]
    // Group 5: 3
    let regexObj = typeString.match(/((bool|int|uint|bytes|string|address)([0-9]*)?)(\[([0-9]*)\])*$/);
    console.log("ARRAY OBJ:", regexObj);
    let type = regexObj[1];
    let size = regexObj[3];
    switch(true) {
      case (regexObj[2] !== undefined):
        let length = regexObj[5] === undefined ? self.generateRandomInt(256) : regexObj[5];
        return self.generateArrayOfType(length, type)
      case (/bool/).test(type):
        return self.generateRandomBool();
      case (/(int|uint)([0-9]*)?/).test(type):
        return self.generateRandomInt(size);
      case (/^bytes([0-9]{1,})/).test(type):
        return self.generateRandomStaticBytes(size);
      case (/(string|bytes)/).test(type):
        return self.generateRandomDynamicType()
      case (/address/).test(type):
        return self.generateRandomAddress();
      default:
        throw new Error("Couldn't find proper ethereum abi type");
    }
  }

  generateRandomBool() {
    return _.sample([true, false]);
  }

  generateArrayOfType(length, type) {
    var arr = [];
    for (var i = 0; i < length; i++) {
        arr.push(this.getTypeFuzz(type));
    }
    return arr;
  }

  generateRandomDynamicType() {
    return Math.random().toString(36).slice(2);
  }

  generateRandomStaticBytes(size) {
    return utils.randomHex(size);
  }

  generateRandomInt(size) {
    return utils.hexToNumber(utils.randomHex(size / 8));
  }

  generateRandomAddress() {
    return utils.randomHex(20);
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let splitCmd = cmd.split(' ');
      let cmdName = splitCmd[0];
      let contractName = splitCmd[1];
      let iterations = splitCmd[2] === undefined ? 1 : splitCmd[2];
      if (cmdName === 'fuzz') {
        self.events.request('contracts:contract', contractName, (contract) => {
          self.logger.info("--  fuzzed vals for " + contractName);
             this.generateFuzz(1, contract);
        });
        return "";
        }
        return false;
    });
  }
}

module.exports = ContractFuzzer;
