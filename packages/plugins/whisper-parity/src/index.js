import { __ } from "embark-i18n";
import { dappPath, canonicalHost, defaultHost } from "embark-utils";
const constants = require("embark-core/constants");
const API = require("./api.js");
import { ws, rpc } from "./check.js";

class Whisper {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.communicationConfig = embark.config.communicationConfig;
    this.embarkConfig = embark.config.embarkConfig;
    this.embark = embark;
    this.webSocketsChannels = {};
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    if (!this.communicationConfig.enabled || this.blockchainConfig.client !== constants.blockchain.clients.parity) {
      return;
    }

    this.api = new API(embark);
    this.whisperNodes = {};

    this.events.request("embarkjs:plugin:register", "messages", "whisper", "embarkjs-whisper");
    this.events.request("embarkjs:console:register", "messages", "whisper", "embarkjs-whisper");

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      this.events.request("processes:register", "communication", {
        launchFn: (cb) => {
          this.startWhisperNode(cb);
        },
        stopFn: (cb) => {
          this.stopWhisperNode(cb);
        }
      });

      this.events.request("processes:launch", "communication", (err) => {
        if (err) {
          this.logger.error(`Error launching whisper process: ${err.message || err}`);
        }
        readyCb();
      });

      this.registerServiceCheck();
    });

    this.events.on("communication:started", () => {
      this.api = new API(embark);
      this.api.registerAPICalls();
      this.connectEmbarkJSProvider();
    });
  }

  _getNodeState(err, version, cb) {
    if (err) return cb({ name: "Whisper node not found", status: "off" });

    let nodeName = "Parity";
    let versionNumber = version.split("-")[0];
    let name = nodeName + " " + versionNumber + " (Whisper)";
    return cb({ name, status: "on" });
  }

  registerServiceCheck() {
    this.events.request("services:register", "Whisper", (cb) => {
      const { host, port, type } = this.communicationConfig.connection;
      if (type === "ws") {
        return ws(host, port, (err, version) => this._getNodeState(err, version, cb));
      }
      rpc(host, port, (err, version) => this._getNodeState(err, version, cb));

    }, 5000, "off");
  }

  startWhisperNode(callback) {
    this.logger.info(`Whisper node has already been started with the Parity blockchain.`);
    callback();
  }

  stopWhisperNode(cb) {
    this.logger.warn(`Cannot stop Whisper process as it has been started with the Parity blockchain.`);
    cb();
  }

  // esline-disable-next-line complexity
  async connectEmbarkJSProvider() {
    let connection = this.communicationConfig.connection || {};
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || "8546",
      type: connection.type || "ws"
    };

    this.events.request("embarkjs:console:setProvider", "messages", "whisper", config);
  }

}

module.exports = Whisper;
