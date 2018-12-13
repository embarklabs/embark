/*globals __*/
const env = require("../../core/env");
const fs = require("../../core/fs");
const utils = require("../../utils/utils");
const EmbarkJS = require("embarkjs");
const IpfsApi = require("ipfs-api");
const stringify = require("json-stringify-safe");
import Web3 from "web3";
import { Embark, Events } from "../../../typings/embark";
import Suggestions from "./suggestions";

class Console {
  private embark: Embark;
  private events: Events;
  private plugins: any;
  private version: string;
  private logger: any;
  private ipc: any;
  private config: any;
  private history: string[];
  private cmdHistoryFile: string;
  private suggestions: Suggestions;
  private providerReady: boolean;

  constructor(embark: Embark, options: any) {
    this.embark = embark;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.logger = options.logger;
    this.ipc = options.ipc;
    this.config = options.config;
    this.history = [];
    this.cmdHistoryFile = options.cmdHistoryFile || fs.dappPath(".embark", "cmd_history");
    this.providerReady = false;
    this.loadHistory();

    if (this.ipc.isServer()) {
      this.ipc.on("console:executeCmd", this.executeCmd.bind(this));
    }
    this.events.setCommandHandler("console:executeCmd", this.executeCmd.bind(this));
    this.events.setCommandHandler("console:history", (cb: any) => this.getHistory(this.cmdHistorySize(), cb));
    this.events.setCommandHandler("console:provider:ready", (cb: any) => {
      if (this.providerReady) {
        return cb();
      }
      this.events.once("console:provider:done", cb);
    });
    this.registerEmbarkJs();
    this.registerConsoleCommands();
    this.registerApi();

    this.suggestions = new Suggestions(embark, options);
  }

  private cmdHistorySize() {
    return env.anchoredValue(env.CMD_HISTORY_SIZE);
  }

  private registerApi() {
    const plugin = this.plugins.createPlugin("consoleApi", {});
    plugin.registerAPICall("post", "/embark-api/command", (req: any, res: any) => {
      this.executeCmd(req.body.command, (err: any, result: any) => {
        if (err) {
          return res.send({result: err.message || err});
        }
        if (typeof result === "string") {
          return res.send({result});
        }
        res.send({result: stringify(result, utils.jsonFunctionReplacer, 2)});
      });
    });
  }

  private processEmbarkCmd(cmd: string, helpDescriptions: any[]) {
    if (cmd === "help" || cmd === __("help") || cmd === "01189998819991197253") {
      const helpText = [
        __("Welcome to Embark") + " " + this.version,
        "",
        __("possible commands are:"),
        "versions - " + __("display versions in use for libraries and tools like web3 and solc"),
        "history - " + __("display console commands history"),
        // TODO: only if the blockchain is actually active!
        // will need to pass te current embark state here
        "ipfs - " + __("instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)"),
        "swarm - " + __("instantiated swarm-api object configured to the current environment (available if swarm is enabled)"),
        "web3 - " + __("instantiated web3.js object configured to the current environment"),
        "EmbarkJS - " + __("EmbarkJS static functions for Storage, Messages, Names, etc."),
        "token - " + __("Copies and prints the token for the cockpit"),
        "debug <txHash> - " + __("Debug the last transaction or the transaction specified by a hash"),
        "    next/n - " + __("During a debug, step over forward"),
        "    previous/p - " + __("During a debug, step over back"),
        "    var local/v l/vl - " + __("During a debug, display local variables"),
        "    var global/v g/vg - " + __("During a debug, display global variables"),
        "    var all/v a/va - " + __("During a debug, display all variables"),
        "    var all/v a/va - " + __("During a debug, display all variables"),
        "log <process> on/off - " + __("Activate or deactivate the logs of a sub-process. Options: blockchain, "),
        "plugin install <package> - " + __("Installs a plugin in the Dapp. eg: plugin install embark-solc"),
      ];
      helpDescriptions.forEach((helpDescription) => {
        helpText.push(`${(helpDescription.use || helpDescription.matches.join("/")).cyan} - ${helpDescription.description}`);
      });
      // Add end commands
      helpText.push("quit".cyan + " - " + __("to immediatly exit (alias: exit)"),
        "",
        __("The web3 object and the interfaces for the deployed contracts and their methods are also available"));
      return helpText.join("\n");
    } else if (["quit", "exit", "sair", "sortir", __("quit")].indexOf(cmd) >= 0) {
      utils.exit();
    }
    return false;
  }

  private executeCmd(cmd: string, callback: any) {
    if (!(cmd.split(" ")[0] === "history" || cmd === __("history"))) {
      this.history.push(cmd);
      this.saveHistory();
    }
    const plugins = this.plugins.getPluginsProperty("console", "console");
    const helpDescriptions = [];
    for (const plugin of plugins) {
      // New API
      if (plugin.options.description) {
        helpDescriptions.push(plugin.options);
      }
      if (plugin.options.matches) {
        const isFunction = typeof plugin.options.matches === "function";
        if ((isFunction && plugin.options.matches.call(this, cmd))
          || (!isFunction && plugin.options.matches.includes(cmd))) {
          return plugin.execute.call(this, cmd, callback);
        }
        continue;
      }

      const pluginResult = plugin.execute.call(this, cmd, {});

      if (typeof pluginResult !== "object") {
        if (pluginResult !== false && pluginResult !== "false" && pluginResult !== undefined) {
          this.logger.warn("[DEPRECATED] In future versions of embark, we expect the console command to return an object " +
            "having 2 functions: match and process." +
            " The documentation with example can be found here: https://embark.status.im/docs/plugin_reference.html#embark-registerConsoleCommand-callback-options");
          return callback(null, pluginResult);
        }
      } else if (pluginResult.match()) {
        return pluginResult.process(callback);
      }
    }

    const output = this.processEmbarkCmd(cmd, helpDescriptions);
    if (output) {
      return callback(null, output);
    }

    try {
      this.events.request("runcode:eval", cmd, callback);
    } catch (e) {
      if (this.ipc.connected && this.ipc.isClient()) {
        return this.ipc.request("console:executeCmd", cmd, callback);
      }
      callback(e);
    }
  }

  private registerEmbarkJs() {
    this.events.emit("runcode:register", "IpfsApi", IpfsApi, false);
    this.events.emit("runcode:register", "Web3", Web3, false);
    this.events.emit("runcode:register", "EmbarkJS", EmbarkJS, false);

    EmbarkJS.Blockchain.done = true;
    if (this.ipc.connected) {
      return;
    }

    this.events.once("code-generator-ready", () => {
      this.events.request("code-generator:embarkjs:provider-code", (code: string) => {
        const func = () => {};
        this.events.request("runcode:eval", code, func, true);
        this.events.request("runcode:eval", this.getInitProviderCode(), () => {
          this.events.emit("console:provider:done");
          this.providerReady = true;
        }, true);
      });
    });
  }

  private getInitProviderCode() {
    const codeTypes: any = {
      blockchain: this.config.blockchainConfig || {},
      communication: this.config.communicationConfig || {},
      names: this.config.namesystemConfig || {},
      storage: this.config.storageConfig || {},
    };

    return this.plugins.getPluginsFor("initConsoleCode").reduce((acc: any, plugin: any) => {
      Object.keys(codeTypes).forEach((codeTypeName: string) => {
        (plugin.embarkjs_init_console_code[codeTypeName] || []).forEach((initCode: any) => {
          const [block, shouldInit] = initCode;
          if (shouldInit.call(plugin, codeTypes[codeTypeName])) {
            acc += block;
          }
        });
      });
      return acc;
    }, "");
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand((cmd: string, options?: any) => {
      const [cmdName, length] = cmd.split(" ");
      return {
        match: () => cmdName === "history",
        process: (callback: any) => this.getHistory(length, callback),
      };
    });
  }

  private loadHistory() {
    if (fs.existsSync(this.cmdHistoryFile)) {
      fs.readFileSync(this.cmdHistoryFile)
        .toString()
        .split("\n")
        .reverse()
        .forEach((cmd: string) => { this.history.push(cmd); });
    }
  }

  private getHistory(historySize: any, callback: any) {
      if (typeof historySize === "string") {
        historySize = parseInt(historySize, 10);
        if (isNaN(historySize)) { return callback("Invalid argument. Please provide an integer."); }
      }
      const length = historySize || this.cmdHistorySize();
      return callback(null, this.history
                              .slice(Math.max(0, this.history.length - length))
                              .filter((line: string) => line.trim())
                              .reverse()
                              .join("\n"));
  }

  private saveHistory() {
    if (fs.existsSync(utils.dirname(this.cmdHistoryFile))) {
      fs.writeFileSync(this.cmdHistoryFile,
                       this.history
                        .slice(Math.max(0, this.history.length - this.cmdHistorySize()))
                        .reverse()
                        .filter((line: string) => line.trim())
                        .join("\n"));
    }
  }
}

module.exports = Console;
