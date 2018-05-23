const fs = require('../../core/fs.js');

class ENS {
	constructor(embark, options) {
		this.logger = embark.logger;
		this.events = embark.events;
		this.web3 = options.web3;
		this.embark = embark;
	}
}