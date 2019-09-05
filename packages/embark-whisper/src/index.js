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
    this.api.registerAPICalls();

    this.events.request("embarkjs:plugin:register", 'messages', 'whisper', 'embarkjs-whisper');
    this.events.request("embarkjs:console:register", 'messages', 'whisper', 'embarkjs-whisper');

    // TODO: should launch its own whisper node
    // this.events.on("communication:started", this.connectEmbarkJSProvider.bind(this));
    this.events.on("blockchain:started", this.connectEmbarkJSProvider.bind(this));

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      // TODO: should launch its own whisper node
      // this.events.request('processes:register', 'communication', {
        // launchFn: (cb) => {
          // this.startProcess(cb);
        // },
        // stopFn: (cb) => { this.stopProcess(cb); }
      // });
      // this.events.request("processes:launch", "communication", (err) => {
        readyCb();
      // });
      // this.registerServiceCheck()
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
