import { __ } from "embark-i18n";
import { dappPath, canonicalHost, defaultHost } from "embark-utils";
const constants = require("embark-core/constants");
const { Api, PARITY_WHISPER_ERROR } = require("./api.js");

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

    if (!this.communicationConfig.enabled || this.communicationConfig.client !== constants.blockchain.clients.parity) {
      return;
    }

    this.whisperNodes = {};

    this.events.request("embarkjs:plugin:register", "messages", "whisper", "embarkjs-whisper");
    this.events.request("embarkjs:console:register", "messages", "whisper", "embarkjs-whisper");

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      this.logger.warn(PARITY_WHISPER_ERROR);
      readyCb();

      this.registerServiceCheck();
    });

    this.events.on("communication:started", () => {
      this.api = new Api(embark);
      this.api.registerAPICalls();
      this.connectEmbarkJSProvider();
    });
  }

  registerServiceCheck() {
    this.events.request("services:register", "Whisper", (cb) => {
      cb({ name: "Whisper Parity", status: "off" });
    }, 1000 * 60 * 30, "off");
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
