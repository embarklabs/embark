import { __ } from "embark-i18n";
import { dappPath, canonicalHost, defaultHost } from "embark-utils";
const constants = require("embark-core/constants");
const API = require("./api.js");
import { BlockchainProcessLauncher } from "./blockchainProcessLauncher";
import { ws, rpcWithEndpoint } from "./check.js";
const { normalizeInput, buildUrlFromConfig } = require("embark-utils");

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

    if (!this.communicationConfig.enabled || this.communicationConfig.client !== constants.blockchain.clients.geth) {
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

    const name = `Whisper v${version} (Geth)`;
    return cb({ name, status: "on" });
  }

  registerServiceCheck() {
    this.events.request("services:register", "Whisper", (cb) => {
      const endpoint = buildUrlFromConfig(this.communicationConfig.connection);
      if (endpoint.startsWith('ws')) {
        return ws(endpoint, (err, version) => this._getNodeState(err, version, cb));
      }
      rpcWithEndpoint(endpoint, (err, version) => this._getNodeState(err, version, cb));
    }, 5000, "off");
  }

  startWhisperNode(callback) {
    this.whisperProcess = new BlockchainProcessLauncher({
      events: this.events,
      logger: this.logger,
      normalizeInput,
      blockchainConfig: this.blockchainConfig,
      communicationConfig: this.communicationConfig,
      locale: this.locale,
      client: constants.blockchain.clients.whisper,
      isDev: this.isDev,
      embark: this.embark
    });
    this.whisperProcess.startBlockchainNode(callback);
  }

  stopWhisperNode(cb) {
    if (!this.whisperProcess) {
      return cb();
    }
    this.whisperProcess.stopBlockchainNode(() => {
      this.logger.info(`The whisper process has been stopped.`);
      cb();
    });
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
