const program = require('commander');
const promptly = require('promptly');
const utils = require('./utils/utils.js');
const Embark = require('../lib/index');
let embark = new Embark;

class Cmd {
  constructor() {
    program.version(embark.version);
  }

  process(args) {
    this.newApp();
    this.demo();
    this.build();
    this.run();
    this.blockchain();
    this.simulator();
    this.test();
    this.reset();
    this.graph();
    this.upload();
    this.versionCmd();
    this.otherCommands();

    //If no arguments are passed display help by default
    if (!process.argv.slice(2).length) {
      program.help();
    }

    program.parse(args);
  }

  newApp() {

    let validateName = function (value) {
      try {
        if (value.match(/^[a-zA-Z\s-]+$/)) return value;
      } catch (e) {
        throw new Error('Name must be only letters, spaces, or dashes');
      }
    };

    program
      .command('new [name]')
      .description('new application')
      .option('--simple', 'create a barebones project meant only for contract development')
      .action(function (name, options) {
        if (name === undefined) {
          return promptly.prompt("Name your app (default is embarkDApp):", {
            default: "embarkDApp",
            validator: validateName
          }, function (err, inputvalue) {
            if (err) {
              console.error('Invalid name:', err.message);
              // Manually call retry
              // The passed error has a retry method to easily prompt again.
              err.retry();
            } else {
              //slightly different assignment of name since it comes from child prompt
              if (options.simple) {
                embark.generateTemplate('simple', './', inputvalue);
              } else {
                embark.generateTemplate('boilerplate', './', inputvalue);
              }
            }
          });
        } else {
          if (options.simple) {
            embark.generateTemplate('simple', './', name);
          } else {
            embark.generateTemplate('boilerplate', './', name);
          }
        }
      });
  }

  demo() {
    program
      .command('demo')
      .description('create a working dapp with a SimpleStorage contract')
      .action(function () {
        embark.generateTemplate('demo', './', 'embark_demo');
      });
  }

  build() {
    program
      .command('build [environment]')
      .description('deploy and build dapp at dist/ (default: development)')
      .action(function (env, _options) {
        embark.build({env: env || 'development'});
      });
  }

  run() {
    program
      .command('run [environment]')
      .option('-p, --port [port]', 'port to run the dev webserver (default: 8000)')
      .option('-b, --host [host]', 'host to run the dev webserver (default: localhost)')
      .option('--noserver', 'disable the development webserver')
      .option('--nodashboard', 'simple mode, disables the dashboard')
      .option('--no-color', 'no colors in case it\'s needed for compatbility purposes')
      .option('--logfile [logfile]', 'filename to output logs (default: none)')
      .description('run dapp (default: development)')
      .action(function (env, options) {
        embark.run({
          env: env || 'development',
          serverPort: options.port,
          serverHost: options.host,
          runWebserver: !options.noserver,
          useDashboard: !options.nodashboard,
          logfile: options.logfile
        });
      });
  }

  blockchain() {
    program
      .command('blockchain [environment]')
      .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, testrpc)')
      .description('run blockchain server (default: development)')
      .action(function (env, options) {
        embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        embark.blockchain(env || 'development', options.client || 'geth');
      });
  }

  simulator() {
    program
      .command('simulator [environment]')
      .description('run a fast ethereum rpc simulator')
      .option('--testrpc', 'use testrpc as the rpc simulator [default]')
      .option('-p, --port [port]', 'port to run the rpc simulator (default: 8545)')
      .option('-h, --host [host]', 'host to run the rpc simulator (default: localhost)')
      .option('-a, --accounts [numAccounts]', 'number of accounts (default: 10)')
      .option('-e, --defaultBalanceEther [balance]', 'Amount of ether to assign each test account (default: 100)')
      .option('-l, --gasLimit [gasLimit]', 'custom gas limit (default: 8000000)')

      .action(function (env, options) {
        embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        embark.simulator({
          port: options.port,
          host: options.host,
          numAccounts: options.numAccounts,
          defaultBalance: options.balance,
          gasLimit: options.gasLimit
        });
      });
  }

  test() {
    program
      .command('test [file]')
      .description('run tests')
      .action(function (file) {
        embark.initConfig('development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        embark.runTests(file);
      });
  }

  upload() {
    program
      .command('upload [platform] [environment]')
      .option('--logfile [logfile]', 'filename to output logs (default: none)')
      .description('upload your dapp to a decentralized storage (e.g embark upload ipfs)')
      .action(function (platform, env, _options) {
        let environment = env || 'development';
        embark.initConfig(environment, {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        _options.env = environment;
        embark.upload(platform, _options);
      });
  }

  graph() {
    program
      .command('graph [environment]')
      .description('generates documentation based on the smart contracts configured')
      .action(function (env, options) {
        embark.graph({
          env: env || 'development',
          logfile: options.logfile
        });
      });
  }

  reset() {
    program
      .command('reset')
      .description('resets embarks state on this dapp including clearing cache')
      .action(function () {
        embark.initConfig('development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        embark.reset();
      });
  }

  versionCmd() {
    program
    .command('version')
    .description('output the version number')
    .action(function () {
      console.log(embark.version);
      process.exit(0);
    });
  }

  otherCommands() {
    program
      .action(function (cmd) {
        console.log('unknown command "%s"'.red, cmd);
        let dictionary = ['new', 'demo', 'build', 'run', 'blockchain', 'simulator', 'test', 'upload', 'version'];
        let suggestion = utils.proposeAlternative(cmd, dictionary);
        if (suggestion) {
          console.log('did you mean "%s"?'.green, suggestion);
        }
        console.log("type embark --help to see the available commands");
        process.exit(0);
      });
  }
  

}

module.exports = Cmd;
