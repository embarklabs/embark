import { __ } from 'embark-i18n';
import {dappPath, canonicalHost, defaultHost} from 'embark-utils';
let Web3 = require('web3');
const constants = require('embark-core/constants');
const API = require('./api.js');

class Whisper {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.communicationConfig = embark.config.communicationConfig;
    this.embarkConfig = embark.config.embarkConfig;
    this.web3 = new Web3();
    this.embark = embark;
    this.web3Ready = false;
    this.webSocketsChannels = {};
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    this.api = new API(embark, this.web3);
    this.api.registerAPICalls();

    this.events.request("runcode:whitelist", 'embarkjs', () => { });
    this.events.request("runcode:whitelist", 'embarkjs-whisper', () => { });

    // TODO: should launch its own whisper node
    // this.events.on("communication:started", this.connectEmbarkJSProvider.bind(this));
    this.events.on("blockchain:started", this.connectEmbarkJSProvider.bind(this));

    embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSWhisperArtifact.bind(this));

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      // TODO: should launch its own whisper node
      console.dir("--- whisper readyCb");
      console.dir('--- registering whisper node');
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

    this.registerEmbarkJSCommunication();
  }

  async addEmbarkJSWhisperArtifact(params, cb) {
    let connection = this.communicationConfig.connection || {};
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };

    const code = `
      var EmbarkJS;
      if (typeof EmbarkJS === 'undefined') {
        EmbarkJS = require('embarkjs');
      }
      const __embarkWhisper = require('embarkjs-whisper');
      EmbarkJS.Messages.registerProvider('whisper', __embarkWhisper.default || __embarkWhisper);
      EmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(config)});
    `;
    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'storage'],
      file: 'init.js',
      format: 'js',
      content: code
    }, cb);
  }

  async registerEmbarkJSCommunication() {
    let checkEmbarkJS = `
      return (typeof EmbarkJS === 'undefined');
    `;
    let EmbarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (EmbarkJSNotDefined) {
      await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
    }

    const registerProviderCode = `
      const __embarkWhisper = require('embarkjs-whisper');
      EmbarkJS.Messages.registerProvider('whisper', __embarkWhisper.default || __embarkWhisper);
    `;

    await this.events.request2('runcode:eval', registerProviderCode);
  }

  async connectEmbarkJSProvider() {
    let connection = this.communicationConfig.connection || {};
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };
    const code = `
      EmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(config)});
    `;

    await this.events.request2('runcode:eval', code);
  }

}

module.exports = Whisper;
