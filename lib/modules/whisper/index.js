let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let Web3 = require('web3');

const {canonicalHost, defaultHost} = require('../../utils/host');

class Whisper {

  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.communicationConfig = embark.config.communicationConfig;
    this.web3 = new Web3();
    this.embark = embark;

    if (!this.communicationConfig.enabled) {
      return;
    }

    this.connectToProvider();
    this.setServiceCheck();
    this.addWhisperToEmbarkJS();
    this.addSetProvider();
  }

  connectToProvider() {
    let {host, port} = this.communicationConfig.connection;
    let web3Endpoint = 'ws://' + host + ':' + port;
    // Note: dont't pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the followin error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
    this.web3.setProvider(new Web3.providers.WebsocketProvider(web3Endpoint, {headers: {Origin: "http://embark"}}));
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
          if (err || version == "2") {
            return cb({name: 'Whisper', status: 'off'});
          }
          return cb({name: 'Whisper (version ' + version + ')', status: 'on'});
        });
      });
    });
  }

  addWhisperToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.communicationConfig === {}) {
      return;
    }
    if ((this.communicationConfig.available_providers.indexOf('whisper') < 0) && (this.communicationConfig.provider !== 'whisper' || this.communicationConfig.enabled !== true)) {
      return;
    }

    // TODO: possible race condition could be a concern
    this.events.request("version:get:web3", function(web3Version) {
      let code = "";
      code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'js', 'message_events.js')).toString();

      if (web3Version[0] === "0") {
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'js', 'embarkjs_old_web3.js')).toString();
        code += "\nEmbarkJS.Messages.registerProvider('whisper', __embarkWhisperOld);";
      } else {
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'js', 'communicationFunctions.js')).toString();
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'js', 'embarkjs.js')).toString();
        code += "\nEmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3);";
      }
      self.embark.addCodeToEmbarkJS(code);
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

    const consoleConfig = Object.assign({}, config, {providerOptions: {headers: {Origin: "http://embark"}}});
    const consoleCode = `\nEmbarkJS.Messages.setProvider('whisper', ${JSON.stringify(consoleConfig)});`;
    this.embark.addConsoleProviderInit('communication', consoleCode, shouldInit);
  }

}

module.exports = Whisper;
