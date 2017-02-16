var Web3 = require('web3');

var Console = function(options) {
  this.plugins = options.plugins;
};

Console.prototype.runCode = function(code) {
  eval(code); // jshint ignore:line
};

Console.prototype.executeCmd = function(cmd, callback) {
  var plugin, pluginOutput;
  var plugins = this.plugins.getPluginsFor('console');
  for (var i = 0; i < plugins.length; i++) {
    plugin = plugins[i];
    pluginOutput = plugin.runCommands(cmd, {});
    if (pluginOutput !== false && pluginOutput !== 'false') return callback(pluginOutput);
  }

  if (cmd === 'help') {
    var helpText = [
      'Welcome to Embark 2',
      '',
      'possible commands are:',
      // TODO: only if the blockchain is actually active!
      // will need to pass te current embark state here
      'web3 - instantiated web3.js object configured to the current environment',
      'quit - to immediatly exit',
      '',
      'The web3 object and the interfaces for the deployed contrats and their methods are also available'
    ];
    return callback(helpText.join('\n'));
  } else if (cmd === 'quit') {
    exit();
  }

  try {
    var result = eval(cmd); // jshint ignore:line
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

