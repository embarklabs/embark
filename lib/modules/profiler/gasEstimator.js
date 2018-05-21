const ethAbi = require('web3-eth-abi');
const contract = require('web3-eth-contract');

class GasEstimator {
	constructor(provider, abi, iterations) {
		this.abi = abi;
		this.iters = iterations;
	}


}