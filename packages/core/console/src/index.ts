import chalk from "chalk";
import { Embark, EmbarkEvents } from "embark-core";
import constants from "embark-core/constants.json";
import { __ } from "embark-i18n";
import { dappPath, escapeHtml, exit, jsonFunctionReplacer, warnIfPackageNotDefinedLocally } from "embark-utils";
import stringify from "json-stringify-safe";
import { dirname } from "path";
import util from "util";

type MatchFunction = (cmd: string) => boolean;
interface HelpDescription {
  matches: string[] | MatchFunction;
  description: string;
  usage?: string;
}

export default class Console {
  private embark: Embark;
  private events: EmbarkEvents;
  private plugins: any;
  private version: string;
  private logger: any;
  private ipc: any;
  private fs: any;
  private config: any;
  private history: string[];
  private cmdHistoryFile: string;
  // private providerReady: boolean;
  private helpCmds: any;

  constructor(embark: Embark, options: any) {
    this.embark = embark;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.logger = options.logger;
    this.fs = embark.fs;
    this.ipc = options.ipc;
    this.config = options.config;
    this.history = [];
    this.cmdHistoryFile = options.cmdHistoryFile || dappPath(".embark", "cmd_history");
    this.loadHistory();
    this.helpCmds = {};

    if (this.ipc.isServer()) {
      this.ipc.on("console:executeCmd", (cmd: string, cb: any) => {
        this.executeCmd(cmd, (err: any, result: any) => {
          if (err) {
            // reformat for IPC reply
            const error = { name: "Console error", message: err, stack: err.stack };
            return cb(error);
          }
          cb(null, typeof result !== "string" ? util.inspect(result) : result);
        });
      });
      this.ipc.on("console:executePartial", (cmd: string, cb: any) => {
        this.executePartial(cmd, (_: any, result: any) => {
          cb(null, util.inspect(result));
        });
      });
      this.ipc.on("console:history:save", true, (cmd: string) => {
        this.saveHistory(cmd, true);
      });
    }
    this.events.setCommandHandler("console:register:helpCmd", (cmdOptions: any, cb: any) => {
      const {cmdName, cmdHelp} = cmdOptions;
      this.helpCmds[cmdName] = cmdHelp;
      if (cb) { cb(); }
    });
    this.events.setCommandHandler("console:unregister:helpCmd", (cmdName: string, cb: any) => {
      delete this.helpCmds[cmdName];
      if (cb) { cb(); }
    });
    this.events.setCommandHandler("console:executeCmd", this.executeCmd.bind(this));
    this.events.setCommandHandler("console:executePartial", this.executePartial.bind(this));
    this.events.setCommandHandler("console:history", (cb: any) => this.getHistory(this.cmdHistorySize(), cb));
    this.registerConsoleCommands();

    if (this.isEmbarkConsole) {
      return;
    }
    this.registerApi();
  }

  private get isEmbarkConsole() {
    return this.ipc.connected && this.ipc.isClient() && this.embark.currentContext && this.embark.currentContext.includes(constants.contexts.console);
  }

  private cmdHistorySize() {
    return parseInt(process.env.CMD_HISTORY_SIZE || constants.console.commandHistorySize, 10);
  }

  private registerApi() {
    const plugin = this.plugins.createPlugin("consoleApi", {});
    plugin.registerAPICall("post", "/embark-api/command", (req: any, res: any) => {
      this.executeCmd(req.body.command, (err: any, result: any, shouldEscapeHtml = true) => {
        if (err) {
          return res.send({ result: err.message || err });
        }
        let response = result;
        if (typeof result !== "string") {
          response = stringify(result, jsonFunctionReplacer, 2);
        } else if (shouldEscapeHtml) {
          // Avoid HTML injection in the Cockpit
          response = escapeHtml(response);
        }
        const jsonResponse = { result: response };
        if (res.headersSent) {
          return res.end(jsonResponse);
        }
        return res.send(jsonResponse);
      });
    });
  }

  private processEmbarkCmd(cmd: string, helpDescriptions: HelpDescription[]) {
    if (cmd === "help" || cmd === __("help") || cmd === "01189998819991197253") {
      const helpText = [
        __("Welcome to Embark") + " " + this.version,
        "",
        __("possible commands are:"),
        // TODO: this help commands should be passed through an API

        // chalk.cyan("swarm") + " - " + __("instantiated swarm-api object configured to the current environment (available if swarm is enabled)"),
        // chalk.cyan("EmbarkJS") + " - " + __("EmbarkJS static functions for Storage, Messages, Names, etc."),
        chalk.cyan("log [process] on/off") + " - " + __("Activate or deactivate the logs of a sub-process. Options: blockchain, ipfs, webserver"),
      ];

      for (const cmdName of Object.keys(this.helpCmds)) {
        const helpCmd = this.helpCmds[cmdName];
        helpText.push(chalk.cyan(cmdName) + " - " + helpCmd);
      }

      // TODO: remove old helpDescriptions
      helpDescriptions.forEach((helpDescription) => {
        let matches = [] as string[];
        if (Array.isArray(helpDescription.matches)) {
          matches = helpDescription.matches as string[];
        }
        helpText.push(`${chalk.cyan(helpDescription.usage || matches.join("/"))} - ${helpDescription.description}`);
      });
      // Add end commands
      helpText.push(chalk.cyan("quit") + " - " + __("to immediately exit (alias: exit)"),
        "",
        __("The web3 object and the interfaces for the deployed contracts and their methods are also available"));
      return helpText.join("\n");
    } else if (["quit", "exit", "sair", "sortir", __("quit")].indexOf(cmd) >= 0) {
      exit(0);
    }
    return false;
  }

  private executePartial(cmd: string, callback: any) {
    // if this is the embark console process, send the command to the process
    // running all the needed services (ie the process running `embark run`)
    if (this.isEmbarkConsole) {
      return this.ipc.request("console:executePartial", cmd, callback);
    }

    this.executeCmd(cmd, (_: any, result: any) => {
      callback(null, result);
    });
  }

  private executeCmd(cmd: string, callback?: any, logEvalCode = false, logEvalError = false) {
    // if this is the embark console process, send the command to the process
    // running all the needed services (ie the process running `embark run`)
    if (this.isEmbarkConsole) {
      return this.ipc.request("console:executeCmd", cmd, callback);
    }

    if (cmd.indexOf("profile") === 0 && warnIfPackageNotDefinedLocally("embark-profiler", this.embark.logger.warn, this.embark.config.embarkConfig) !== true) {
      return callback(null, "please install embark-profiler plugin");
    }
    if (!(cmd.split(" ")[0] === "history" || cmd === __("history"))) {
      this.saveHistory(cmd);
    }
    const plugins = this.plugins.getPluginsProperty("console", "console");
    const helpDescriptions: any[] = [];
    for (const plugin of plugins) {
      if (plugin.description) {
        helpDescriptions.push({
          description: plugin.description,
          matches: plugin.matches,
          usage: plugin.usage,
        });
      }
      if (plugin.matches) {
        const isFunction = typeof plugin.matches === "function";
        if ((isFunction && plugin.matches.call(this, cmd))
          || (!isFunction && plugin.matches.includes(cmd))) {
          return plugin.process.call(this, cmd, callback);
        }
        continue;
      }

      const pluginResult = plugin.call(this, cmd, {});

      if (typeof pluginResult !== "object") {
        if (pluginResult !== false && pluginResult !== "false" && pluginResult !== undefined) {
          this.logger.warn("[DEPRECATED] In future versions of embark, we expect the console command to return an object " +
            "having 2 functions: match and process." +
            " The documentation with example can be found here: https://framework.embarklabs.io/docs/plugin_reference.html#embark-registerConsoleCommand-callback-options");
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

    this.events.request("runcode:eval", cmd, callback, true, logEvalCode, logEvalError);
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __("display console commands history"),
      matches: (cmd: string) => {
        const [cmdName] = cmd.split(" ");
        return cmdName === "history";
      },
      process: (cmd: string, callback: any) => {
        const [_cmdName, length] = cmd.split(" ");
        this.getHistory(length, callback);
      },
      usage: "history [optionalLength]",
    });
  }

  private loadHistory() {
    if (this.fs.existsSync(this.cmdHistoryFile)) {
      this.fs.readFileSync(this.cmdHistoryFile)
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

  private saveHistory(cmd: string, fromIpcClient = false) {
    const history = this.history;
    if (fromIpcClient) {
      if (history[history.length - 1] !== cmd) {
        history.push(cmd);
      }
      this.events.emit("console:history:save", cmd);
      return this.ipc.broadcast("console:history:save", cmd, true);
    }

    history.push(cmd);
    if (this.ipc.isServer()) {
      this.ipc.broadcast("console:history:save", cmd, true);
    } else if (this.ipc.connected) {
      this.ipc.client.emit("console:history:save", cmd);
    }

    if (this.fs.existsSync(dirname(this.cmdHistoryFile))) {
      this.fs.writeFileSync(
        this.cmdHistoryFile,
        history
          .slice(Math.max(0, history.length - this.cmdHistorySize()))
          .reverse()
          .filter((line: string) => line.trim())
          .join("\n"),
      );
    }
  }
}
