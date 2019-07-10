import { __ } from 'embark-i18n';
import {dappPath, canonicalHost, defaultHost} from 'embark-utils';
let Web3 = require('web3');
const constants = require('embark-core/constants');
import * as path from 'path';
const API = require('./api.js');

const EMBARK_RESOURCE_ORIGIN = "http://embark";

class Whisper {
  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.communicationConfig = embark.config.communicationConfig;
    this.web3 = new Web3();
    this.embark = embark;
    this.web3Ready = false;
    this.webSocketsChannels = {};
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    if (embark.currentContext.includes('test') && options.node &&options.node === 'vm') {
      this.logger.info(__('Whisper disabled in the tests'));
      return;
    }

    if (!this.communicationConfig.enabled) {
      return;
    }

    this.api = new API(embark, this.web3);
    this.api.registerAPICalls();

    // ================
    // TODO:
    // figure out best way to detect is a node exists or launch a whisper process or wait for the blockchain process
    // ================
    // this.events.on("blockchain:ready", this.executeEmbarkJSBlockchain.bind(this));

    this.setServiceCheck();

    // TODO: see above, not ideal to do this, need engine.start process
    // can also register service and instead react to it and connect
    // this.waitForWeb3Ready(() => {
      // this.registerAndSetWhisper();
    // });
    this.events.on("blockchain:ready", () => {
      this.registerAndSetWhisper();
    });

    // ===============================
    //   this.connectToProvider();

    //   this.events.request('processes:register', 'whisper', (cb) => {
    //     this.waitForWeb3Ready(() => {
    //       this.web3.shh.getInfo((err) => {
    //         if (err) {
    //           const message = err.message || err;
    //           if (message.indexOf('not supported') > -1) {
    //             this.logger.error('Whisper is not supported on your node. Are you using the simulator?');
    //             return this.logger.trace(message);
    //           }
    //         }
    //         this.setServiceCheck();
    //         this.addWhisperToEmbarkJS();
    //         this.addSetProvider();
    //         this.registerAPICalls();
    //         cb();
    //       });
    //     });
    //   });

    //   this.events.request('processes:launch', 'whisper');
  }

  connectToProvider() {
    let {host, port} = this.communicationConfig.connection;
    let web3Endpoint = 'ws://' + host + ':' + port;
    // Note: dont't pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the followin error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
    this.web3.setProvider(new Web3.providers.WebsocketProvider(web3Endpoint, {headers: {Origin: EMBARK_RESOURCE_ORIGIN}}));
  }

  registerAndSetWhisper() {
    if (this.communicationConfig === {}) {
      return;
    }
    if ((this.communicationConfig.available_providers.indexOf('whisper') < 0) && (this.communicationConfig.provider !== 'whisper' || this.communicationConfig.enabled !== true)) {
      return;
    }

    // let linkedModulePath = path.join(this.modulesPath, 'embarkjs-whisper');
    // if (process.platform === 'win32') linkedModulePath = linkedModulePath.replace(/\\/g, '\\\\');

    // const code = `
    //   const __embarkWhisperNewWeb3 = EmbarkJS.isNode ? require('${linkedModulePath}') : require('embarkjs-whisper');
    //   EmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3.default || __embarkWhisperNewWeb3);
    // `;

    let code = `
      const __embarkWhisperNewWeb3 = require('embarkjs-whisper');
      EmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3.default || __embarkWhisperNewWeb3);
    `;

    let connection = this.communicationConfig.connection || {};

    if (!(this.communicationConfig.provider === 'whisper' && this.communicationConfig.enabled === true)) {
      return this.events.request('runcode:eval', code, () => {
      });
    }

    // todo: make the add code a function as well
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };
    code += `\nEmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(config)});`;

    // this.embark.addCodeToEmbarkJS(code);
    this.events.request('runcode:eval', code, (err) => {
      // if (err) {
        // return cb(err);
      // }
    });
  }

  // ===============================
  // ===============================
  // ===============================
  // ===============================
  // ===============================
  // ===============================

  waitForWeb3Ready(cb) {
    if (this.web3Ready) {
      return cb();
    }
    if (this.web3.currentProvider.connection.readyState !== 1) {
      this.connectToProvider();
      return setTimeout(this.waitForWeb3Ready.bind(this, cb), 50);
    }
    this.web3Ready = true;
    cb();
  }

  setServiceCheck() {
    const self = this;
    self.events.request("services:register", 'Whisper', function(cb) {
      if (!self.web3.currentProvider || self.web3.currentProvider.connection.readyState !== 1) {
        return self.connectToProvider();
      }
      // 1) Parity does not implement shh_version JSON-RPC method
      // 2) web3 1.0 still does not implement web3_clientVersion
      // so we must do all by our own
      self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, clientVersion) => {
        if (err) return cb(err);
        if (clientVersion.indexOf("Parity-Ethereum//v2") === 0) {
          // This is Parity
          return self.web3.shh.getInfo(function(err) {
            if (err) {
              return cb({name: 'Whisper', status: 'off'});
            }
            // TOFIX Assume Whisper v6 until there's a way to understand it via JSON-RPC
            return cb({name: 'Whisper (version 6)', status: 'on'});
          });
        }
        // Assume it is a Geth compliant client
        self.web3.shh.getVersion(function(err, version) {
          if (err || version === "2") {
            return cb({name: 'Whisper', status: 'off'});
          }
          return cb({name: 'Whisper (version ' + version + ')', status: 'on'});
        });
      });
    });
  }

  addSetProvider() {
    let connection = this.communicationConfig.connection || {};
    const shouldInit = (communicationConfig) => {
      return (communicationConfig.provider === 'whisper' && communicationConfig.enabled === true);
    };

    // todo: make the add code a function as well
    const config = {
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };
    const code = `\nEmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(config)});`;

    this.embark.addProviderInit('communication', code, shouldInit);

    const consoleConfig = Object.assign({}, config, {providerOptions: {headers: {Origin: EMBARK_RESOURCE_ORIGIN}}});
    const consoleCode = `\nEmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(consoleConfig)});`;
    this.embark.addConsoleProviderInit('communication', consoleCode, shouldInit);
  }

}

module.exports = Whisper;
