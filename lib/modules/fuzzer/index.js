const ethAbi = require('web3-eth-abi');
const utils = require('web3-utils');
const _ = require('underscore');


// generates random inputs based on the inputs of an ABI
class ContractFuzzer {
	constructor(abi) {
		this.abi = abi;
	}

	generateFuzz() {
		this.abi.forEach((abiMethod) => {
			let inputTypes = abiMethod.inputs.map(input => input.type);
			let fuzzedInputType = _.reduce(inputTypes, decipherType, 0);
		})
	}

	getTypeFuzz(type) {
		switch() {
			case 'uintN' || 'intN':
			
			case 'bytesN':
				return generateRandomStaticBytes(size);
			case 'string' || 'bytes':
				return generateRandomDynamicType()
			case 'address':
				return generateRandomAddress();
			default:
		}
	}

	generateArrayOfType(length, type) {
		var arr = [];
		for (var i = 0; i < length; i++) {
			arr.push(getTypeFuzz(type));
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
    	return utils.hexToNumber(utils.randomHex(size));
  	}

  	generateRandomAddress() {
  		return utils.randomHex(20);
  	}

}