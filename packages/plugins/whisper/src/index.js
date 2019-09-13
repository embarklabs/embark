import { __ } from 'embark-i18n';
import {dappPath, canonicalHost, defaultHost} from 'embark-utils';
const constants = require('embark-core/constants');
const API = require('./api.js');

class Whisper {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.communicationConfig = embark.config.communicationConfig;
    this.embarkConfig = embark.config.embarkConfig;
    this.embark = embark;
    this.webSocketsChannels = {};
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    this.api = new API(embark);
    this.whisperNodes = {};

    this.events.request("embarkjs:plugin:register", 'messages', 'whisper', 'embarkjs-whisper');
    this.events.request("embarkjs:console:register", 'messages', 'whisper', 'embarkjs-whisper');

    this.events.setCommandHandler("whisper:node:register", (clientName, startCb) => {
      this.whisperNodes[clientName] = startCb;
    });

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      let clientName = this.communicationConfig.client || "geth";
      let registerCb = this.whisperNodes[clientName];
      if (!registerCb) return readyCb("whisper client " + clientName + " not found");
      registerCb.apply(registerCb, [readyCb]);
    });

    this.events.on("communication:started", () => {
      this.api = new API(embark);
      this.api.registerAPICalls();
      this.connectEmbarkJSProvider();
    });
  }

  async connectEmbarkJSProvider() {
    let connection = this.communicationConfig.connection || {};
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };

    this.events.request("embarkjs:console:setProvider", 'messages', 'whisper', config);
  }

}

module.exports = Whisper;
