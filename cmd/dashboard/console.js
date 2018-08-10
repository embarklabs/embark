let utils = require('../../lib/utils/utils.js');

class Console {
  constructor(options) {
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.ipc = options.ipc;

    if (this.ipc.isServer()) {
      this.ipc.on('console:executeCmd', this.executeCmd.bind(this));
    }
  }

  processEmbarkCmd (cmd) {
    if (cmd === 'help' || cmd === __('help')) {
      let helpText = [
        __('Welcome to Embark') + ' ' + this.version,
        '',
        __('possible commands are:'),
        'versions - ' + __('display versions in use for libraries and tools like web3 and solc'),
        // TODO: only if the blockchain is actually active!
        // will need to pass te current embark state here
        'ipfs - ' + __('instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)'),
        'web3 - ' + __('instantiated web3.js object configured to the current environment'),
        'quit - ' + __('to immediatly exit (alias: exit)'),
        '',
        __('The web3 object and the interfaces for the deployed contracts and their methods are also available')
      ];
      return helpText.join('\n');
    } else if (['quit', 'exit', 'sair', 'sortir', __('quit')].indexOf(cmd) >= 0) {
      utils.exit();
    }
    return false;
  }

  executeCmd(cmd, callback) {
    var pluginCmds = this.plugins.getPluginsProperty('console', 'console');
    for (let pluginCmd of pluginCmds) {
      let pluginResult = pluginCmd.call(this, cmd, {});
      if (pluginResult.match()) {
        return pluginResult.process(callback);
      }
    }

    let output = this.processEmbarkCmd(cmd);
    if (output) {
      return callback(null, output);
    }

    try {
      this.events.request('runcode:eval', cmd, callback, true);
    }
    catch (e) {
      if (this.ipc.connected && this.ipc.isClient()) {
        return this.ipc.request('console:executeCmd', cmd, callback);
      }
      callback(e.message);
    }
  }
}

module.exports = Console;
