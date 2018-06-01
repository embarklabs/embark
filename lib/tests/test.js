const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const utils = require('../utils/utils');

function getSimulator() {
  try {
    return require('ganache-cli');
  } catch (e) {
    const moreInfo = 'For more information see https://github.com/trufflesuite/ganache-cli';
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(__('Simulator not found; Please install it with "%s"', 'npm install ganache-cli --save'));
      console.error(moreInfo);
      throw e;
    }
    console.error("==============");
    console.error(__("Tried to load Ganache CLI (testrpc), but an error occurred. This is a problem with Ganache CLI"));
    console.error(moreInfo);
    console.error("==============");
    throw e;
  }
}

class Test {
  constructor(options) {
    this.options = options || {};
    this.simOptions = this.options.simulatorOptions || {};
    this.web3 = new Web3();
    if (this.simOptions.node) {
      this.web3.setProvider(new this.web3.providers.HttpProvider(this.simOptions.node));
    } else {
      this.sim = getSimulator();
      this.web3.setProvider(this.sim.provider(this.simOptions));
    }
  }

  config(options) {
    this.options = utils.recursiveMerge(this.options, options);
    this.simOptions = this.options.simulatorOptions || {};

    this.engine = new Engine({
      env: this.options.env || 'test',
      // TODO: confi will need to detect if this is a obj
      embarkConfig: this.options.embarkConfig || 'embark.json',
      interceptLogs: false
    });

    this.engine.init({
      logger: new TestLogger({logLevel: 'debug'})
    });

    if (this.simOptions.node) {
      this.web3.setProvider(new this.web3.providers.HttpProvider(this.simOptions.node));
    } else {
      this.sim = getSimulator();
      this.web3.setProvider(this.sim.provider(this.simOptions));
    }
  }
}

module.exports = Test;
