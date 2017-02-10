var program = require('commander');
var colors = require('colors');

var Cmd = function(Embark) {
  this.Embark = Embark;
  program.version(Embark.version);
};

Cmd.prototype.process = function(args) {
  this.newApp();
  this.demo();
  this.build();
  this.run();
  this.blockchain();
  this.simulator();
  this.test();
  this.upload();
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
    self.Embark.initConfig(env || 'development', {
        embarkConfig: 'embark.json'
    });
    self.Embark.build(env || 'development');
  });
};

Cmd.prototype.run = function() {
  var self = this;
  program
  .command('run [environment]')
  .option('-p, --port [port]', 'port to run the dev webserver (default: 8000)')
  .option('-b, --host [host]', 'host to run the dev webserver (default: localhost)')
  .option('--noserver', 'disable the development webserver')
  .option('--nodashboard', 'simple mode, disables the dashboard')
  .option('--no-color', 'no colors in case it\'s needed for compatbility purposes')
  .description('run dapp (default: development)')
  .action(function(env, options) {
    self.Embark.initConfig(env || 'development', {
        embarkConfig: 'embark.json'
    });
    self.Embark.run({
      env: env || 'development',
      serverPort: options.port,
      serverHost: options.host,
      runWebserver: !options.noserver,
      useDashboard: !options.nodashboard
    });
  });
};

Cmd.prototype.blockchain = function() {
  var self = this;
  program
  .command('blockchain [environment]')
  .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, parity, ethersim, testrpc')
  .description('run blockchain server (default: development)')
  .action(function(env ,options) {
    self.Embark.initConfig(env || 'development', {
        embarkConfig: 'embark.json'
    });
    self.Embark.blockchain(env || 'development', options.client || 'geth');
  });
};

Cmd.prototype.simulator = function() {
  program
  .command('simulator')
  .description('run a fast ethereum rpc simulator')
  .option('--testrpc', 'use testrpc as the rpc simulator [default]')
  .action(function(options) {
    //console.log('TestRPC not found; Please install it with "npm install -g ethereumjs-testrpc');
    exec('testrpc');
  });
};

Cmd.prototype.test = function() {
  program
  .command('test')
  .description('run tests')
  .action(function() {
    exec('mocha test/ --no-timeouts');
  });
};

Cmd.prototype.upload = function() {
  var self = this;
  program
  .command('upload [platform] [environment]')
  .description('upload your dapp to a decentralized storage. possible options: ipfs, swarm (e.g embark upload swarm)')
  .action(function(platform, env, options) {
    // TODO: get env in cmd line as well
    self.Embark.initConfig(env || 'development', {
        embarkConfig: 'embark.json', interceptLogs: false
    });
    self.Embark.upload(platform);
  });
};

Cmd.prototype.otherCommands = function() {
  program
  .action(function(env){
    console.log('unknown command "%s"'.red, env);
  });
};

module.exports = Cmd;
