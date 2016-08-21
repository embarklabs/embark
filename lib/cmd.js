var program = require('commander');
var colors = require('colors');

var Cmd = function(Embark) {
  this.Embark = Embark;
};

Cmd.prototype.process = function(args) {
  this.newApp();
  this.demo();
  this.build();
  this.run();
  this.blockchain();
  this.simulator();
  this.otherCommands();
  program.parse(args);
};

Cmd.prototype.newApp = function() {
  var self = this;
  program
  .command('new [name]')
  .description('new application')
  .action(function(name, options) {
    if (name === undefined) {
      console.log("please specify your app Name".red);
      console.log("e.g embark new MyApp".green);
      console.log("e.g embark new --help for more information".green);
      exit();
    }
    self.Embark.generateTemplate('boilerplate', './', name);
  });
};

Cmd.prototype.demo = function() {
  var self = this;
  program
  .command('demo')
  .description('create a working dapp with a SimpleStorage contract')
  .action(function() {
    self.Embark.generateTemplate('demo', './', 'embark_demo');
  });
};

Cmd.prototype.build = function() {
  var self = this;
  program
  .command('build [environment]')
  .description('deploy and build dapp at dist/ (default: development)')
  .action(function(env, options) {
    self.Embark.build(env || 'development');
  });
};

Cmd.prototype.run = function() {
  var self = this;
  program
  .command('run [environment]')
  .description('run dapp (default: development)')
  .action(function(env, options) {
    self.Embark.run(env || 'development');
  });
};

Cmd.prototype.blockchain = function() {
  var self = this;
  program
  .command('blockchain [environment]')
  .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, parity, ethersim, testrpc')
  .description('run blockchain server (default: development)')
  .action(function(env ,options) {
    self.Embark.blockchain(env || 'development', options.client || 'geth');
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
  .action(function(env){
    console.log('unknown command "%s"'.red, env);
  });
};

module.exports = Cmd;
