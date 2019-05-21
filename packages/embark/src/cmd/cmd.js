import { __, setOrDetectLocale } from 'embark-i18n';
import { diagramPath } from 'embark-utils';
const program = require('commander');
const EmbarkController = require('./cmd_controller.js');
const fs = require('../lib/core/fs.js');

let embark = new EmbarkController();

class Cmd {
  constructor() {
    program.version(embark.version);
  }

  process(args) {
    this.newApp();
    this.demo();
    this.build();
    this.run();
    this.console();
    this.blockchain();
    this.simulator();
    this.test();
    this.reset();
    this.ejectWebpack();
    this.graph();
    this.scaffold();
    this.upload();
    this.versionCmd();
    this.helpCmd();
    this.otherCommands();

    //If no arguments are passed display help by default
    if (!process.argv.slice(2).length) {
      program.help();
    }

    program.parse(args);
  }

  newApp() {

    let validateName = function(value) {
      try {
        if (value.match(/^[a-zA-Z\s-]+$/)) return value;
      } catch (e) {
        throw new Error(__('Name must be only letters, spaces, or dashes'));
      }
    };

    program
      .command('new [name]')
      .description(__('New Application'))
      .option('--simple', __('an alias for --contracts-only'))
      .option('--contracts-only', __('create a barebones project meant only for contract development'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--template <name/url>', __('download a template using a known name or a git host URL'))
      .action(function(name, options) {
        setOrDetectLocale(options.locale);

        const contractsOnly = options.simple || options.contractsOnly;

        if (name === undefined) {
          const promptly = require('promptly');
          return promptly.prompt(__("Name your app (default is %s):", 'embarkDapp'), {
            default: "embarkDApp",
            validator: validateName
          }, function(err, inputvalue) {
            if (err) {
              console.error(__('Invalid name') + ':', err.message);
              // Manually call retry
              // The passed error has a retry method to easily prompt again.
              err.retry();
            } else {
              //slightly different assignment of name since it comes from child prompt
              if (contractsOnly) {
                embark.generateTemplate('simple', './', inputvalue);
              } else {
                embark.generateTemplate('boilerplate', './', inputvalue, options.template);
              }
            }
          });
        }
        if (contractsOnly) {
          embark.generateTemplate('simple', './', name);
        } else {
          embark.generateTemplate('boilerplate', './', name, options.template);
        }
      });
  }

  demo() {
    program
      .command('demo')
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--template <name/url>', __('download a demo template using a known name or a git host URL'))
      .description(__('create a working dapp with a SimpleStorage contract'))
      .action(function(options) {
        setOrDetectLocale(options.locale);
        if(options.template) {
          const hostedGitInfo = require('hosted-git-info');
          const hgi = hostedGitInfo.fromUrl(options.template);
          const url = !hgi ? `embark-framework/embark-${options.template}-template#demo`:options.template;
          const folderName = !hgi ? `embark_${options.template}_demo`:'template_demo';
          embark.generateTemplate('demo', './', folderName, url);
        } else {
          embark.generateTemplate('demo', './', 'embark_demo');
        }
      });
  }

  build() {
    program
      .command('build [environment]')
      .option('--contracts', 'only compile contracts into Embark wrappers')
      .option('--logfile [logfile]', __('filename to output logs (default: none)'))
      .option('-c, --client [client]', __('Use a specific ethereum client [%s] (default: %s)', 'geth, parity', 'geth'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--pipeline [pipeline]', __('webpack config to use (default: production)'))
      .description(__('deploy and build dapp at ') + 'dist/ (default: development)')
      .action(function(env, _options) {
        setOrDetectLocale(_options.locale);
        _options.env = env || 'development';
        _options.logFile = _options.logfile; // fix casing
        _options.logLevel = _options.loglevel; // fix casing
        _options.onlyCompile = _options.contracts;
        _options.webpackConfigName = _options.pipeline || 'production';
        embark.build(_options);
      });
  }

  run() {
    program
      .command('run [environment]')
      .option('-p, --port [port]', __('port to run the dev webserver (default: %s)', '8000'))
      .option('-c, --client [client]', __('Use a specific ethereum client [%s] (default: %s)', 'geth, parity', 'geth'))
      .option('-b, --host [host]', __('host to run the dev webserver (default: %s)', 'localhost'))
      .option('--noserver', __('disable the development webserver'))
      .option('--nodashboard', __('simple mode, disables the dashboard'))
      .option('--nobrowser', __('prevent the development webserver from automatically opening a web browser'))
      .option('--no-color', __('no colors in case it\'s needed for compatbility purposes'))
      .option('--logfile [logfile]', __('filename to output logs (default: %s)', 'none'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--pipeline [pipeline]', __('webpack config to use (default: development)'))
      .option('--no-single-use-auth-token', __('disable the single use of token in cockpit'))
      .description(__('run dapp (default: %s)', 'development'))
      .action(function(env, options) {
        setOrDetectLocale(options.locale);
        embark.run({
          env: env || 'development',
          serverPort: options.port,
          serverHost: options.host,
          client: options.client,
          locale: options.locale,
          runWebserver: !options.noserver ? null : false,
          useDashboard: !options.nodashboard,
          logFile: options.logfile,
          logLevel: options.loglevel,
          webpackConfigName: options.pipeline || 'development',
          openBrowser: !options.nobrowser ? null : false,
          singleUseAuthToken: options.singleUseAuthToken
        });
      });
  }

  console() {
    program
      .command('console [environment]')
      .option('-c, --client [client]', __('Use a specific ethereum client [%s] (default: %s)', 'geth, parity', 'geth'))
      .option('--logfile [logfile]', __('filename to output logs (default: %s)', 'none'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--pipeline [pipeline]', __('webpack config to use (default: development)'))
      .option('--no-single-use-auth-token', __('disable the single use of token in cockpit'))
      .description(__('Start the Embark console'))
      .action(function(env, options) {
        setOrDetectLocale(options.locale);
        embark.console({
          env: env || 'development',
          client: options.client,
          locale: options.locale,
          logFile: options.logfile,
          logLevel: options.loglevel,
          singleUseAuthToken: options.singleUseAuthToken,
          webpackConfigName: options.pipeline || 'development'
        });
      });
  }

  blockchain() {
    program
      .command('blockchain [environment]')
      .option('-c, --client [client]', __('Use a specific ethereum client [%s] (default: %s)', 'geth, parity', 'geth'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('run blockchain server (default: %s)', 'development'))
      .action(function(env, options) {
        setOrDetectLocale(options.locale);
        embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        embark.blockchain(env || 'development', options.client);
      });
  }

  simulator() {
    program
      .command('simulator [environment]')
      .description(__('run a fast ethereum rpc simulator'))
      .option('--testrpc', __('use ganache-cli (former "testrpc") as the rpc simulator [%s]', 'default'))
      .option('-p, --port [port]', __('port to run the rpc simulator (default: %s)', '8545'))
      .option('--host [host]', __('host to run the rpc simulator (default: %s)', 'localhost'))
      .option('-a, --accounts [numAccounts]', __('number of accounts (default: %s)', '10'))
      .option('-e, --defaultBalanceEther [balance]', __('Amount of ether to assign each test account (default: %s)', '100'))
      .option('-l, --gasLimit [gasLimit]', __('custom gas limit (default: %s)', '8000000'))
      .option('--locale [locale]', __('language to use (default: en)'))

      .action(function(env, options) {
        setOrDetectLocale(options.locale);
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
      .option('-e, --env <env>', __('configuration environment to use (default: development)'))
      .option('-n , --node <node>', __('node for running the tests ["vm", "embark", <endpoint>] (default: vm)\n') +
              '                       vm - ' + __('start and use an Ethereum simulator (ganache)') + '\n' +
              '                       embark - ' + __('use the node of a running embark process') + '\n' +
              '                       <endpoint> - ' + __('connect to and use the specified node'))
      .option('--gasDetails', __('print the gas cost for each contract deployment when running the tests. Deprecated: Please use --gas-details'))
      .option('-d , --gas-details', __('print the gas cost for each contract deployment when running the tests'))
      .option('-t , --tx-details', __('print the details of the transactions that happen during tests'))
      .option('-c , --coverage', __('generate a coverage report after running the tests (vm only)'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'warn')
      .option('--solc', __('run only solidity tests'))
      .description(__('run tests'))
      .action(function(file, options) {
        const node = options.node || 'vm';
        const urlRegexExp = /^(vm|embark|((ws|https?):\/\/([a-zA-Z0-9_.-]*):?([0-9]*)?))$/i;
        if (!urlRegexExp.test(node)) {
          console.error(`invalid --node option: must be "vm", "embark" or a valid URL\n`.red);
          options.outputHelp();
          process.exit(1);
        }
        options.node = node;
        if (options.coverage && options.node !== 'vm') {
          console.error(`invalid --node option: coverage supports "vm" only\n`.red);
          options.outputHelp();
          process.exit(1);
        }
        setOrDetectLocale(options.locale);
        embark.runTests({
          file,
          solc: options.solc,
          logLevel: options.loglevel,
          gasDetails: options.gasDetails,
          txDetails: options.txDetails,
          node: options.node,
          coverage: options.coverage,
          env: options.env || 'development'
        });
      });
  }

  upload() {
    program
      .command('upload [environment]')
      //.option('--ens [ensDomain]', __('ENS domain to associate to'))
      .option('--logfile [logfile]', __('filename to output logs (default: %s)', 'none'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('-c, --client [client]', __('Use a specific ethereum client [%s] (default: %s)', 'geth, parity', 'geth'))
      .option('--pipeline [pipeline]', __('webpack config to use (default: production)'))
      .description(__('Upload your dapp to a decentralized storage') + '.')
      .action(function(env, _options) {
        setOrDetectLocale(_options.locale);
        if (env === "ipfs" || env === "swarm") {
          console.warn(("did you mean " + "embark upload".bold + " ?").underline);
          console.warn("In embark 3.1 forwards, the correct command is embark upload <environment> and the provider is configured in config/storage.js");
        }
        _options.env = env || 'development';
        _options.ensDomain = _options.ens;
        _options.logFile = _options.logfile; // fix casing
        _options.logLevel = _options.loglevel; // fix casing
        _options.webpackConfigName = _options.pipeline || 'production';
        embark.upload(_options);
      });
  }

  graph() {
    program
      .command('graph [environment]')
      .option('--skip-undeployed', __('Graph will not include undeployed contracts'))
      .option('--skip-functions', __('Graph will not include functions'))
      .option('--skip-events', __('Graph will not include events'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .option('--output [svgfile]', __('filepath to output SVG graph to (default: %s)', diagramPath()))
      .description(__('generates documentation based on the smart contracts configured'))
      .action(function(env, options) {
        setOrDetectLocale(options.locale);
        embark.graph({
          env: env || 'development',
          logFile: options.logfile,
          skipUndeployed: options.skipUndeployed,
          skipFunctions: options.skipFunctions,
          skipEvents: options.skipEvents,
          output: options.output || diagramPath()
        });
      });
  }

  scaffold() {
    program
      .command('scaffold [contractOrFile] [fields...]')
      .option('--framework <framework>', 'UI framework to use. (default: react)')
      .option('--contract-language <language>', 'Language used for the smart contract generation (default: solidity)')
      .option('--overwrite', 'Overwrite existing files. (default: false)')
      .description(__('Generates a contract and a function tester for you\nExample: ContractName field1:uint field2:address --contract-language solidity --framework react'))
      .action(function(contractOrFile, fields, options) {
        setOrDetectLocale(options.locale);
        options.env = 'development';
        options.logFile = options.logfile; // fix casing
        options.logLevel = options.loglevel; // fix casing
        options.onlyCompile = options.contracts;
        options.client = options.client || 'geth';
        options.webpackConfigName = options.pipeline || 'development';
        options.contractOrFile = contractOrFile;
        options.fields = fields;

        embark.scaffold(options);
      });
  }

  reset() {
    program
      .command('reset')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('resets embarks state on this dapp including clearing cache'))
      .action(function(options) {
        setOrDetectLocale(options.locale);
        embark.initConfig('development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        embark.reset({
          embarkConfig: 'embark.json'
        });
      });
  }

  ejectWebpack() {
    program
      .command('eject-build-config')
      .alias('eject-webpack')
      .description(__('copy the default build config into your dapp for customization'))
      .action(function() {
        embark.initConfig('development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        embark.ejectWebpack();
      });
  }

  versionCmd() {
    program
      .command('version')
      .description(__('output the version number'))
      .action(function() {
        console.log(embark.version);
        process.exit(0);
      });
  }

  helpCmd() {
    program
      .command('help')
      .description(__('output usage information and help information'))
      .action(function() {
        console.log("Documentation can be found at: ".green + "https://embark.status.im/docs/".underline.green);
        console.log("");
        console.log("Have an issue? submit it here: ".green + "https://github.com/embark-framework/embark/issues/new".underline.green);
        console.log("or chat with us directly at: ".green + "https://gitter.im/embark-framework/Lobby".underline.green);
        program.help();
        process.exit(0);
      });
  }

  otherCommands() {
    program
      .action(function(cmd) {
        console.log((__('unknown command') + ' "%s"').red, cmd);

        let suggestion;

        if (cmd === 'compile') {
          // we bypass `proposeAlternative()` here as `build` isn't
          // similar enough
          suggestion = 'build --contracts';
        } else {
          const {proposeAlternative} = require('embark-utils');
          let dictionary = ['new', 'demo', 'build', 'run', 'blockchain', 'simulator', 'test', 'upload', 'version', 'console', 'eject-webpack', 'graph', 'help', 'reset'];
          suggestion = proposeAlternative(cmd, dictionary);
        }
        if (suggestion) {
          console.log((__('did you mean') + ' "%s"?').green, suggestion);
        }
        console.log("type embark --help to see the available commands");
        process.exit(0);
      });
  }

}

module.exports = Cmd;
