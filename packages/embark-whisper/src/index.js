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

    this.whisperNodes = {};

    this.events.setCommandHandler("whisper:node:register", (clientName, startCb) => {
      this.whisperNodes[clientName] = startCb;
    });

    this.events.request("communication:node:register", "whisper", (readyCb) => {
      let clientName = this.communicationConfig.client;
      let registerCb = this.whisperNodes[clientName];
      registerCb.apply(registerCb, [readyCb]);
    });

    this.events.request("runcode:whitelist", 'embarkjs', () => { });
    this.events.request("runcode:whitelist", 'embarkjs-whisper', () => { });

    this.events.on("communication:started", () => {
      this.setWhisperProvider();
      this.api = new API(embark, this.web3);
      this.api.registerAPICalls();
      this.connectEmbarkJSProvider.bind(this)
    });

    this.embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSWhisperArtifact.bind(this));
    this.registerEmbarkJSCommunication()
  }

  setWhisperProvider() {
    let {host, port} = this.communicationConfig.connection;
    let web3Endpoint = 'ws://' + host + ':' + port;
    // Note: dont't pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the followin error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
    this.web3.setProvider(new Web3.providers.WebsocketProvider(web3Endpoint, {headers: {Origin: constants.embarkResourceOrigin}}));
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
