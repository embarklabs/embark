let fs = require('../../core/fs');
let utils = require('../../utils/utils');
const EmbarkJS = require('embarkjs');
const IpfsApi = require('ipfs-api');
const Web3 = require('web3');
const stringify = require('json-stringify-safe');

class Console {
  constructor(_embark, options) {
    this.embark = _embark;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.logger = options.logger;
    this.ipc = options.ipc;
    this.config = options.config;
    this.history = [];
    this.cmdHistoryFile = options.cmdHistoryFile || process.env.DEFAULT_CMD_HISTORY_PATH;
    this.loadHistory();

    if (this.ipc.isServer()) {
      this.ipc.on('console:executeCmd', this.executeCmd.bind(this));
    }
    this.events.setCommandHandler("console:executeCmd", this.executeCmd.bind(this));
    this.events.setCommandHandler("console:history", (cb) => this.getHistory(process.env.DEFAULT_CMD_HISTORY_SIZE, cb));
    this.registerEmbarkJs();
    this.registerConsoleCommands();
    this.registerApi();
  }

  registerApi() {
    let plugin = this.plugins.createPlugin('consoleApi', {});
    plugin.registerAPICall('post', '/embark-api/command', (req, res) => {
      this.executeCmd(req.body.command, (_err, result) => {
        res.send({result: stringify(result, null, 2)});
      });
    });
  }

  processEmbarkCmd (cmd) {
    if (cmd === 'help' || cmd === __('help')) {
      let helpText = [
        __('Welcome to Embark') + ' ' + this.version,
        '',
        __('possible commands are:'),
        'versions - ' + __('display versions in use for libraries and tools like web3 and solc'),
        'history - ' + __('display console commands history'),
        // TODO: only if the blockchain is actually active!
        // will need to pass te current embark state here
        'ipfs - ' + __('instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)'),
        'swarm - ' + __('instantiated swarm-api object configured to the current environment (available if swarm is enabled)'),
        'web3 - ' + __('instantiated web3.js object configured to the current environment'),
        'EmbarkJS - ' + __('EmbarkJS static functions for Storage, Messages, Names, etc.'),
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
    if (!(cmd.split(' ')[0] === 'history' || cmd === __('history'))) {
      this.history.push(cmd);
      this.saveHistory();
    }
    var pluginCmds = this.plugins.getPluginsProperty('console', 'console');
    for (let pluginCmd of pluginCmds) {
      let pluginResult = pluginCmd.call(this, cmd, {});
      if(typeof pluginResult !== 'object'){
        if (pluginResult !== false && pluginResult !== 'false' && pluginResult !== undefined) {
          this.logger.warn("[DEPRECATED] In future versions of embark, we expect the console command to return an object " +
            "having 2 functions: match and process. The documentation with example can be found here: https://embark.status.im/docs/plugin_reference.html#embark-registerConsoleCommand-callback-options");
          return callback(null, pluginResult);
        }
      } else if (pluginResult.match()) {
        return pluginResult.process(callback);
      }
    }

    let output = this.processEmbarkCmd(cmd);
    if (output) {
      return callback(null, output);
    }

    try {
      this.events.request('runcode:eval', cmd, callback);
    }
    catch (e) {
      if (this.ipc.connected && this.ipc.isClient()) {
        return this.ipc.request('console:executeCmd', cmd, callback);
      }
      callback(e);
    }
  }

  registerEmbarkJs() {
    this.events.emit('runcode:register', 'IpfsApi', IpfsApi, false);
    this.events.emit('runcode:register', 'Web3', Web3, false);
    this.events.emit('runcode:register', 'EmbarkJS', EmbarkJS, false);

    EmbarkJS.Blockchain.done = true;
    if (this.ipc.connected) {
      return;
    }

    this.events.once('code-generator-ready', () => {
      this.events.request('code-generator:embarkjs:provider-code', (code) => {
        const func = () => {};
        this.events.request('runcode:eval', code, func, true);
        this.events.request('runcode:eval', this.getInitProviderCode(), func, true);
      });
    });
  }

  getInitProviderCode() {
    const codeTypes = {
      'communication': this.config.communicationConfig || {},
      'names': this.config.namesystemConfig || {},
      'storage': this.config.storageConfig || {}
    };

    return this.plugins.getPluginsFor('initConsoleCode').reduce((acc, plugin) => {
      Object.keys(codeTypes).forEach(codeTypeName => {
        (plugin.embarkjs_init_console_code[codeTypeName] || []).forEach(initCode => {
          let [block, shouldInit] = initCode;
          if (shouldInit.call(plugin, codeTypes[codeTypeName])) {
            acc += block;
          }
        });
      });
      return acc;
    }, '');
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand((cmd, _options) => {
      let [cmdName, length] = cmd.split(' ');
      return {
        match: () => cmdName === 'history',
        process: (callback) => this.getHistory(length, callback)
      };
    });
  }

  loadHistory() {
    if (fs.existsSync(this.cmdHistoryFile)) {
      fs.readFileSync(this.cmdHistoryFile)
        .toString()
        .split('\n')
        .reverse()
        .forEach((cmd) => { this.history.push(cmd); });
    }
  }

  getHistory(_length, callback) {
      if (typeof _length === "string") {
        _length = parseInt(_length, 10);
        if (isNaN(_length)) return callback("Invalid argument. Please provide an integer.");
      }
      let length = _length || process.env.DEFAULT_CMD_HISTORY_SIZE;
      return callback(null, this.history
                              .slice(Math.max(0, this.history.length - length))
                              .filter(line => line.trim())
                              .reverse()
                              .join('\n'));
  }

  saveHistory() {
    if (fs.existsSync(utils.dirname(this.cmdHistoryFile))) {
      fs.writeFileSync(this.cmdHistoryFile,
                       this.history
                        .slice(Math.max(0, this.history.length - process.env.DEFAULT_CMD_HISTORY_SIZE))
                        .reverse()
                        .filter(line => line.trim())
                        .join('\n'));
    }
  }
}

module.exports = Console;
