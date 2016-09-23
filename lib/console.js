var Web3 = require('web3');

var Console = function(options) {
};

Console.prototype.runCode = function(code) {
  eval(code);
};

Console.prototype.executeCmd = function(cmd, callback) {
  if (cmd === 'help') {
    var helpText = [
      'Welcome to Embark 2',
      '',
      'possible commands are:',
      'quit - to immediatly exit',
      '',
      'The web3 object and the interfaces for the deployed contrats and their methods are also available'
    ];
    return callback(helpText.join('\n'));
  } else if (cmd === 'quit') {
    exit();
  };

  try {
    var result = eval(cmd);
    return callback(result);
  }
  catch(e) {
    return callback(e.message.red);
  }
};

module.exports = Console;

