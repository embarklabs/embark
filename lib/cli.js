var program = require('vorpal')();
var colors = require('colors');
var path = require('path');
var Embark = require('../lib/index');

this.version = Embark.version;

this.noargs = program.parse(process.argv, {use: 'minimist'})._ === undefined;

program
  .command('some-cmd', 'just a mock command')
  .autocomplete(['new', 'demo', 'build'])
  .action(function (args, cb) {
    // do the command stuff
    // ...
    console.log('some-cmd invoked');
    // setTimeout(function () {
    //   console.log('some-cmd completed after 1000 ms');
      return this.noargs ? cb() : null; // <<----- cb() will drop one back to the vorpal prompt, parse() or show().
    // }, 1000)
  });

program
  .command('new [name]', 'create a new application')
  .action(function (args, cb) {
    Embark.generateTemplate('boilerplate', './', args.name);
  });

program
  .command('demo', 'create a working dapp with a SimpleStorage contract')
  .action(function() {
    Embark.generateTemplate('demo', './', 'embark_demo');
  });

program
  .command('build [environment]')
  .description('deploy and build dapp at dist/ (default: development)')
  .action(function(env, options) {
    Embark.build({env: env || 'development'});
  });

program
  .command('run [environment]')
  .option('-p, --port [port]', 'port to run the dev webserver (default: 8000)')
  .option('-b, --host [host]', 'host to run the dev webserver (default: localhost)')
  .option('--noserver', 'disable the development webserver')
  .option('--nodashboard', 'simple mode, disables the dashboard')
  .option('--no-color', 'no colors in case it\'s needed for compatbility purposes')
  .description('run dapp (default: development)')
  .action(function(env, options) {
    Embark.run({
      env: env || 'development',
      serverPort: options.port,
      serverHost: options.host,
      runWebserver: !options.noserver,
      useDashboard: !options.nodashboard
    });
  });

program
  .command('blockchain [environment]')
  .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, parity, ethersim, testrpc')
  .description('run blockchain server (default: development)')
  .action(function(env ,options) {
    Embark.initConfig(env || 'development', {
      embarkConfig: 'embark.json',
      interceptLogs: false
    });
    Embark.blockchain(env || 'development', options.client || 'geth');
  });

program
  .command('simulator [environment]')
  .description('run a fast ethereum rpc simulator')
  .option('--testrpc', 'use testrpc as the rpc simulator [default]')
  .option('-p, --port [port]', 'port to run the rpc simulator (default: 8000)')
  .option('-h, --host [host]', 'host to run the rpc simulator (default: localhost)')
  .action(function(env, options) {
    Embark.initConfig(env || 'development', {
      embarkConfig: 'embark.json',
      interceptLogs: false
    });
    Embark.simulator({port: options.port, host: options.host});
  });

program
  .command('test')
  .description('run tests')
  .action(function() {
    program.exec('mocha test');
  });

program
  .command('upload [platform] [environment]')
  .description('upload your dapp to a decentralized storage. possible options: ipfs, swarm (e.g embark upload swarm)')
  .action(function(platform, env, options) {
    // TODO: get env in cmd line as well
    Embark.initConfig(env || 'development', {
      embarkConfig: 'embark.json', interceptLogs: false
    });
    Embark.upload(platform);
  });

if (this.noargs) {
  program
    .delimiter('embark $')
    .exec('help')
} else {
  // argv is mutated by the first call to parse.
  process.argv.unshift('');
  process.argv.unshift('');
  program
    .on('client_command_executed', function (evt) {
      process.exit(0)
    })
    .delimiter('embark $')
    .parse(process.argv)
}