var utils = require('../core/utils.js');
var RunCode = require('../core/runCode.js');

var Console = function(options) {
  this.plugins = options.plugins;
  this.version = options.version;
};

Console.prototype.runCode = function(code) {
  RunCode.doEval(code); // jshint ignore:line
};

Console.prototype.processEmbarkCmd = function(cmd) {
  if (cmd === 'help') {
    var helpText = [
      'Welcome to Embark ' + this.version,
      '',
      'possible commands are:',
      // TODO: only if the blockchain is actually active!
      // will need to pass te current embark state here
      'web3 - instantiated web3.js object configured to the current environment',
      'quit - to immediatly exit',
      '',
      'The web3 object and the interfaces for the deployed contracts and their methods are also available'
    ];
    return helpText.join('\n');
  } else if (cmd === 'quit') {
    utils.exit();
  }
  return false;
};

Console.prototype.executeCmd = function(cmd, callback) {
  var plugin, pluginOutput;
  var plugins = this.plugins.getPluginsFor('console');
  for (var i = 0; i < plugins.length; i++) {
    plugin = plugins[i];
    pluginOutput = plugin.runCommands(cmd, {});
    if (pluginOutput !== false && pluginOutput !== 'false') return callback(pluginOutput);
  }

  var output = this.processEmbarkCmd(cmd);
  if (output) {
    return callback(output);
  }

  try {
    var result = RunCode.doEval(cmd);
    return callback(result);
  }
  catch(e) {
    if (e.message.indexOf('not defined') > 0) {
      return callback(("error: " + e.message).red + ("\nType " + "help".bold + " to see the list of available commands").cyan);
    } else {
      return callback(e.message);
    }
  }
};

module.exports = Console;
