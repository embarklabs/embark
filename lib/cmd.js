var program = require('commander');
var colors = require('colors');

var Cmd = function(Embark) {
  this.Embark = Embark;
};

Cmd.prototype.process = function(args) {
  this.run();
  this.simulator();
  this.otherCommands();
  program.parse(args);
};

Cmd.prototype.run = function() {
  var self = this;
  program
  .command('run [environment]')
  .description('run dapp (default: development)')
  //.option('-e', '--environment', 'choose environment to run (default: development)')
  .action(function(env, options) {
    //var EtherSim = require('ethersim');
    //EtherSim.startServer();
    self.Embark.run(env || 'development');
  });
};

Cmd.prototype.simulator = function() {
  program
  .command('simulator')
  .description('run a fast ethereum rpc simulator')
  .option('--ethersim', 'use ethersim as the rpc simulator [default]')
  .action(function() {
    var EtherSim;
    try {
      EtherSim = require('ethersim');
    } catch(e) {
      console.log('EtherSim not found; Please install it with "npm install ethersim --save"');
      console.log('For more information see https://github.com/iurimatias/ethersim');
      process.exit(1);
    }
    EtherSim.startServer();
  });
};

Cmd.prototype.otherCommands = function() {
  program
  .command('*')
  .action(function(env){
    console.log('unknown command "%s"'.red, env);
  });
};

module.exports = Cmd;
