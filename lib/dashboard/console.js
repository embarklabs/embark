let utils = require('../utils/utils.js');
let RunCode = require('../core/runCode.js');

class Console {
  constructor(options) {
    this.plugins = options.plugins;
    this.version = options.version;
    this.contractsConfig = options.contractsConfig;
  }

  runCode(code) {
    RunCode.doEval(code); // jshint ignore:line
  }

  processEmbarkCmd (cmd) {
    if (cmd === 'help') {
      let helpText = [
        'Welcome to Embark ' + this.version,
        '',
        'possible commands are:',
        'versions - display versions in use for libraries and tools like web3 and solc',
        // TODO: only if the blockchain is actually active!
        // will need to pass te current embark state here
        'web3 - instantiated web3.js object configured to the current environment',
        'quit - to immediatly exit',
        '',
        'The web3 object and the interfaces for the deployed contracts and their methods are also available'
      ];
      return helpText.join('\n');
    } else if (cmd === 'versions') {
      //let currentSolcVersion = require('../../package.json').dependencies.solc;
      let solcVersionInConfig = this.contractsConfig.versions.solc;

      //let web3Version = require('../../package.json').dependencies["web3.js"].replace("^","");
      let web3VersionInConfig = this.contractsConfig.versions["web3.js"];

      let text = [
        'versions in use:',
        'solc: ' + solcVersionInConfig,
        'web3.js: ' + web3VersionInConfig
      ];

      return text.join('\n');
    } else if (cmd === 'quit') {
      utils.exit();
    }
    return false;
  }

  executeCmd(cmd, callback) {
    let plugin, pluginOutput;
    let plugins = this.plugins.getPluginsFor('console');
    for (let i = 0; i < plugins.length; i++) {
      plugin = plugins[i];
      pluginOutput = plugin.runCommands(cmd, {});
      if (pluginOutput !== false && pluginOutput !== 'false') return callback(pluginOutput);
    }

    let output = this.processEmbarkCmd(cmd);
    if (output) {
      return callback(output);
    }

    try {
      let result = RunCode.doEval(cmd);
      return callback(result);
    }
    catch (e) {
      if (e.message.indexOf('not defined') > 0) {
        return callback(("error: " + e.message).red + ("\nType " + "help".bold + " to see the list of available commands").cyan);
      } else {
        return callback(e.message);
      }
    }
  }
}

module.exports = Console;
