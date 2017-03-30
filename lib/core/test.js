let getSimulator = function () {
  try {
    return require('ethereumjs-testrpc');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('Simulator not found; Please install it with "npm install ethereumjs-testrpc --save"');
      console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save"');
      console.log('For more information see https://github.com/ethereumjs/testrpc');
      // TODO: should throw exception instead
      return process.exit();
    }
    console.log("==============");
    console.log("Tried to load testrpc but an error occurred. This is a problem with testrpc");
    console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save". Alternatively install node 6.9.1 and the testrpc 3.0');
    console.log("==============");
    throw e;
  }
};


class Test {
  constructor(options) {
    this.opts = options === undefined ? {} : options;
    this.opts.logLevel = this.opts.hasOwnProperty('logLevel') ? this.opts.logLevel : 'debug';
    this.opts.simulatorOptions = this.opts.hasOwnProperty('simulatorOptions') ? this.opts.simulatorOptions : {};
    this.sim = getSimulator();
  }

  newWebThree() {
    try {
      let Web3 = require('web3');
      let web3 = new Web3();
      web3.setProvider(this.sim.provider(this.opts.simulatorOptions));
      return web3;
    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = Test;
