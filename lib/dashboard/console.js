let utils = require('../utils/utils.js');
let RunCode = require('../core/runCode.js');

class Console {
  constructor(options) {
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.contractsConfig = options.contractsConfig;
  }

  runCode(code) {
    RunCode.doEval(code);
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
        'quit - to immediatly exit (alias: exit)',
        '',
        'The web3 object and the interfaces for the deployed contracts and their methods are also available'
      ];
      return helpText.join('\n');
    } else if (['quit', 'exit', 'sair', 'sortir'].indexOf(cmd) >= 0) {
      utils.exit();
    }
    return false;
  }

  executeCmd(cmd, callback) {
    var pluginCmds = this.plugins.getPluginsProperty('console', 'console');
    for (let pluginCmd of pluginCmds) {
      let pluginOutput = pluginCmd.call(this, cmd, {});
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
