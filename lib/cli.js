var program = require('vorpal')();
var colors = require('colors');
var path = require('path');
var Embark = require('../lib/index');

var noargs = program.parse(process.argv, {use: 'minimist'})._ === undefined;

program
  .command('version', 'prints Embark version information')
  .action(function (args, cb) {
    return noargs ? cb() : program.log(Embark.version);
  });

program
  .command('new [name]', 'create a new application')
  .autocomplete(function () {
    return path.dirname(__dirname).split("/").pop();
  })
  .action(function (args, cb) {
    if (!args.name) {
      var dirName = path.dirname(__dirname).split("/").pop();
      program.prompt('No name provided. Use ' + dirName + '?')
    }
    Embark.generateTemplate('boilerplate', './', args.name);
    return noargs ? cb() : null;
  });

program
  .command('demo', 'create a working dapp with a SimpleStorage contract')
  .action(function () {
    Embark.generateTemplate('demo', './', 'embark_demo');
    return noargs ? cb() : null;
  });

program
  .command('build [environment]')
  .description('deploy and build dapp at dist/ (default: development)')
  .action(function (args) {
    Embark.build({env: args.environment || 'development'});
    return noargs ? cb() : null;
  });

program
  .command('run [environment]')
  .option('-p, --port [port]', 'port to run the dev webserver (default: 8000)')
  .option('-b, --host [host]', 'host to run the dev webserver (default: localhost)')
  .option('--noserver', 'disable the development webserver')
  .option('--nodashboard', 'simple mode, disables the dashboard')
  .option('--no-color', 'no colors in case it\'s needed for compatbility purposes')
  .description('run dapp (default: development)')
  .action(function (args, cb) {
    Embark.run({
      env: args.environment || 'development',
      serverPort: args.options.port,
      serverHost: args.options.host,
      runWebserver: !args.options.noserver,
      useDashboard: !args.options.nodashboard
    });
    return noargs ? cb() : null;
  });

program
  .command('blockchain [environment]')
  .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, parity, ethersim, testrpc')
  .description('run blockchain server (default: development)')
  .action(function (args, cb) {
    Embark.initConfig(args.environment || 'development', {
      embarkConfig: 'embark.json',
      interceptLogs: false
    });
    Embark.blockchain(args.environment || 'development', args.options.client || 'geth');
    return noargs ? cb() : null;
  });

program
  .command('simulator [environment]', 'Run a fast ethereum rpc simulator')
  .option('--testrpc', 'use testrpc as the rpc simulator [default]')
  .option('-p, --port [port]', 'port to run the rpc simulator (default: 8000)')
  .option('-h, --host [host]', 'host to run the rpc simulator (default: localhost)')
  .action(function (args, cb) {
    Embark.initConfig(args.environment || 'development', {
      embarkConfig: 'embark.json',
      interceptLogs: false
    });
    Embark.simulator({port: args.options.port, host: args.options.host});
    return noargs ? cb() : null;
  });

program
  .command('test')
  .description('run tests')
  .action(function () {
    program.exec('mocha test');
    return noargs ? cb() : null;
  });

program
  .command('upload [platform] [environment]')
  .description('upload your dapp to a decentralized storage. possible options: ipfs, swarm (e.g embark upload swarm)')
  .action(function (args, cb) {
    // TODO: get env in cmd line as well
    Embark.initConfig(args.environment || 'development', {
      embarkConfig: 'embark.json', interceptLogs: false
    });
    Embark.upload(args.platform);
    return noargs ? cb() : null;
  });

if (noargs) {
  program
  // .command.autocomplete(['build', 'blockchain', 'upload', 'run', 'demo', 'test'])
    .delimiter('embark $')
    .exec('help');
} else {
  // argv is mutated by the first call to parse.
  process.argv.unshift('');
  process.argv.unshift('');
  program
    .on('client_command_executed', function (evt) {
      process.exit(0);
    })
    .delimiter('')
    .parse(process.argv);
}