const RunCode = require('./runCode.js');
const EmbarkJS = require('embarkjs');
const IpfsApi = require('ipfs-api');
const Web3 = require('web3');

class CodeRunner {
  constructor(options) {
    this.config = options.config;
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.commands = [];
    this.runCode = new RunCode();
    let self = this;

    if (this.ipc.isServer()) {
      this.ipc.on('runcode:getCommands', (_err, callback) => {
        let result = {web3Config: self.runCode.getWeb3Config(), commands: self.commands};
        callback(null, result);
      });
    }

    if (this.ipc.isClient() && this.ipc.connected) {
      this.ipc.listenTo('runcode:newCommand', function (command) {
        if (command.varName) {
          self.events.emit("runcode:register", command.varName, command.code);
        } else {
          self.events.request("runcode:eval", command.code);
        }
      });
    }

    if (!this.ipc.connected) {
      this.runCode.registerVar('IpfsApi', IpfsApi);
      this.runCode.registerVar('Web3', Web3);
      this.runCode.registerVar('EmbarkJS', EmbarkJS);
      this.events.on('code-generator-ready', () => {
        this.events.request('code-generator:embarkjs:provider-code', (code) => {
          this.runCode.doEval(code);
          const codeTypes = {
            'communication': this.config.communicationConfig || {},
            'names': this.config.namesystemConfig || {},
            'storage': this.config.storageConfig || {}
          };

          let initProvidersCode = '';
          let initCodes = this.plugins.getPluginsFor('initConsoleCode');
          for (let plugin of initCodes) {
            for (let codeTypeName of Object.keys(codeTypes)) {
              let initCodes = plugin.embarkjs_init_console_code[codeTypeName] || [];
              for (let initCode of initCodes) {
                let [block, shouldInit] = initCode;
                if (shouldInit.call(plugin, codeTypes[codeTypeName])) {
                  initProvidersCode += block;
                }
              }
            }
          }
          this.runCode.doEval(initProvidersCode);
        });
      });
    }

    this.events.on("runcode:register", (varName, code) => {
      if (self.ipc.isServer() && varName !== 'web3') {
        self.commands.push({varName, code});
        self.ipc.broadcast("runcode:newCommand", {varName, code});
      }
      self.runCode.registerVar(varName, code);
    });

    this.events.setCommandHandler('runcode:getContext', (cb) => {
      cb(self.runCode.context);
    });

    this.events.setCommandHandler('runcode:eval', (code, cb, forConsoleOnly = false) => {
      if (!cb) {
        cb = function() {};
      }
      const awaitIdx = code.indexOf('await');
      if (awaitIdx > -1) {
        if (awaitIdx < 2) {
          let end = code.length;
          if (code[end - 1] === ';') {
            end--; // Remove the `;` because we add function calls
          }
          code = code.substring(5, end); // remove await keyword
        } else {
          code = `(async function() {${code}})();`;
        }
      }
      let result = self.runCode.doEval(code);

      if (forConsoleOnly && self.ipc.isServer()) {
        self.commands.push({code});
        self.ipc.broadcast("runcode:newCommand", {code});
      }

      if (result instanceof Promise) {
        return result.then((value) => cb(null, value)).catch(cb);
      }

      cb(null, result);
    });
  }

}

module.exports = CodeRunner;
