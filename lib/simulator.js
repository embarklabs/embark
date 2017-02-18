var shelljs = require('shelljs');

var Simulator = function(options) {
  this.blockchainConfig = options.blockchainConfig;
};

Simulator.prototype.run = function(options) {
  var cmds = [];

  cmds.push("-p " + (this.blockchainConfig.rpcPort || options.port || 8545));
  cmds.push("-h " + (this.blockchainConfig.rpcHost || options.host || 'localhost'));
  cmds.push("-a " + (options.num || 10));

  shelljs.exec('testrpc ' + cmds.join(' '));
};

module.exports = Simulator;

