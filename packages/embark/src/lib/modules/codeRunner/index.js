const VM = require('./vm');
const fs = require('../../core/fs');
const deepEqual = require('deep-equal');
const EmbarkJS = require('embarkjs');
const IpfsApi = require("ipfs-api");
const Web3 = require('web3');

class CodeRunner {
  constructor(embark, options) {
    this.ready = false;
    this.blockchainConnected = false;
    this.config = embark.config;
    this.plugins = embark.plugins;
    this.logger = embark.logger;
    this.events = embark.events;
    this.ipc = options.ipc;
    this.vm = new VM({
      sandbox: {
        IpfsApi,
        Web3,
        EmbarkJS
      },
      require: {
        mock: {
          fs: {
            access: fs.access,
            diagramPath: fs.diagramPath,
            dappPath: fs.dappPath,
            embarkPath: fs.embarkPath,
            existsSync: fs.existsSync,
            ipcPath: fs.ipcPath,
            pkgPath: fs.pkgPath,
            readFile: fs.readFile,
            readFileSync: fs.readFileSync,
            readJSONSync: fs.readJSONSync,
            readdir: fs.readdir,
            readdirSync: fs.readdirSync,
            stat: fs.stat,
            statSync: fs.statSync,
            tmpDir: fs.tmpDir
          }
        }
      }
    }, this.logger);
    this.embark = embark;
    this.commands = [];

    this.registerIpcEvents();
    this.IpcClientListen();
    this.registerEvents();
    this.registerCommands();
    this.events.emit('runcode:ready');
    this.ready = true;
  }

  registerIpcEvents() {
    if (!this.ipc.isServer()) {
      return;
    }

    this.ipc.on('runcode:getCommands', (_err, callback) => {
      let result = {web3Config: this.vm.getWeb3Config(), commands: this.commands};
      callback(null, result);
    });
  }

  IpcClientListen() {
    if (!this.ipc.isClient() || !this.ipc.connected) {
      return;
    }

    this.ipc.listenTo('runcode:newCommand', (command) => {
      if (command.varName) {
        this.events.emit("runcode:register", command.varName, command.code);
      } else {
        this.events.request("runcode:eval", command.code);
      }
    });
  }

  registerEvents() {
    this.events.on("runcode:register", this.registerVar.bind(this));

    this.events.on("runcode:init-console-code:updated", (code, cb) => {
      this.evalCode(code, (err, _result) => {
        if(err) {
          this.logger.error("Error running init console code: ", err);
        }
        else if(code.includes("EmbarkJS.Blockchain.setProvider")) {
          this.events.emit('runcode:blockchain:connected');
          this.blockchainConnected = true;
        }
        cb();
      });
    });

    this.events.on("runcode:embarkjs-code:updated", (code, cb) => {
      this.evalCode(code, (err, _result) => {
        if(err) {
          this.logger.error("Error running embarkjs code: ", err);
        }
        cb();
      });
    });
  }

  registerCommands() {
    this.events.setCommandHandler('runcode:getContext', (cb) => {
      cb(this.vm.options.sandbox);
    });
    this.events.setCommandHandler('runcode:eval', this.evalCode.bind(this));
    this.events.setCommandHandler('runcode:ready', (cb) => {
      if (this.ready) {
        return cb();
      }
      this.events.once("runcode:ready", cb);
    });
    this.events.setCommandHandler('runcode:blockchain:connected', (cb) => {
      if (this.blockchainConnected) {
        return cb();
      }
      this.events.once("runcode:blockchain:connected", cb);
    });
    this.events.setCommandHandler('runcode:embarkjs:reset', this.resetEmbarkJS.bind(this));
  }

  resetEmbarkJS(cb) {
    this.events.request("code-generator:embarkjs:provider-code", (code) => {
      this.evalCode(code, (err) => {
        if (err) {
          return cb(err);
        }
        this.events.request("code-generator:embarkjs:init-provider-code", (providerCode) => {
          this.evalCode(providerCode, (err, _result) => {
            cb(err);
          }, false, true);
        });
      }, true);
    });
  }

  registerVar(varName, code, toRecord = true, cb = () => {}) {
    const command = {varName, code};
    if (toRecord && !this.commands.some(cmd => deepEqual(cmd, command))) {
      if (this.ipc.isServer()) {
        this.commands.push(command);
        this.ipc.broadcast("runcode:newCommand", command);
      }
    }
    this.vm.registerVar(varName, code, cb);
  }

  evalCode(code, cb, isNotUserInput = false, tolerateError = false) {
    cb = cb || function () {};

    if (!code) return cb(null, '');

    this.vm.doEval(code, tolerateError, (err, result) => {
      if(err) {
        return cb(err);
      }
      const command = {code};
      if (isNotUserInput && this.ipc.isServer() && !this.commands.some(cmd => cmd.code === command.code)) {
          this.commands.push(command);
          this.ipc.broadcast("runcode:newCommand", command);
      }
      
      cb(null, result);
    });
  }
}

module.exports = CodeRunner;
