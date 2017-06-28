let program = require('commander');
let colors = require('colors');
let shelljs = require('shelljs');
let promptly = require('promptly');
let path = require('path');
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
    this.upload();
    this.otherCommands();

    //If no arguments are passed display help by default
    if (!process.argv.slice(2).length) {
      program.help();
    }

    program.parse(args);
  }

  newApp(name) {

    let validateName = function (value) {
      try {
        if (value.match(/^[a-zA-Z\s\-]+$/)) return value;
      } catch (e) {
        throw new Error('Name must be only letters, spaces, or dashes');
      }
    };

    program
      .command('new [name]')
      .description('new application')
      .action(function (name) {
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
              embark.generateTemplate('boilerplate', './', inputvalue);
            }
          });
        } else {
          embark.generateTemplate('boilerplate', './', name);
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
      .action(function (env, options) {
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
      .description('run dapp (default: development)')
      .action(function (env, options) {
        embark.run({
          env: env || 'development',
          serverPort: options.port,
          serverHost: options.host,
          runWebserver: !options.noserver,
          useDashboard: !options.nodashboard
        });
      });
  }

  blockchain() {
    program
      .command('blockchain [environment]')
      .option('-c, --client [client]', 'Use a specific ethereum client or simulator (supported: geth, parity, ethersim, testrpc')
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
      .option('-p, --port [port]', 'port to run the rpc simulator (default: 8000)')
      .option('-h, --host [host]', 'host to run the rpc simulator (default: localhost)')
      .action(function (env, options) {
        embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        embark.simulator({port: options.port, host: options.host});
      });
  }

  test() {
    program
      .command('test')
      .description('run tests')
      .action(function () {
        shelljs.exec('mocha test');
      });
  }

  upload() {
    program
      .command('upload [platform] [environment]')
      .description('upload your dapp to a decentralized storage. possible options: ipfs, swarm (e.g embark upload swarm)')
      .action(function (platform, env, options) {
        // TODO: get env in cmd line as well
        embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        embark.upload(platform);
      });
  }

  otherCommands() {
    program
      .action(function (env) {
        console.log('unknown command "%s"'.red, env);
        console.log("type embark --help to see the available commands");
        process.exit(0);
      });
  }

}

module.exports = Cmd;
