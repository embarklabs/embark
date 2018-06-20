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

    this.connectToProvider();
    this.setServiceCheck();
    this.addWhisperToEmbarkJS();
    this.addSetProvider();
  }

  connectToProvider() {
    let {host, port} = this.communicationConfig.connection;
    let web3Endpoint = 'ws://' + host + ':' + port;
    this.web3.setProvider(new Web3.providers.WebsocketProvider(web3Endpoint, {headers: {Origin: "embark"}}));
  }

  setServiceCheck() {
    const self = this;
    self.events.request("services:register", 'Whisper', function (cb) {
      if (!self.web3.currentProvider || self.web3.currentProvider.connection.readyState !== 1) {
        return self.connectToProvider();
      }
      self.web3.shh.getVersion(function (err, version) {
        if (err || version == "2") {
          return cb({name: 'Whisper', status: 'off'});
        } else {
          return cb({name: 'Whisper (version ' + version + ')', status: 'on'});
        }
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
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'js', 'embarkjs.js')).toString();
        code += "\nEmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3);";
      }
      self.embark.addCodeToEmbarkJS(code);
    });
  }

  addSetProvider() {
    let connection = this.communicationConfig.connection || {};
    // todo: make the add code a function as well
    let config = JSON.stringify({
      server: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    });
    let code = "\nEmbarkJS.Messages.setProvider('whisper'," + config + ");";

    let shouldInit = (communicationConfig) => {
      return (communicationConfig.provider === 'whisper' && communicationConfig.enabled === true);
    };

    this.embark.addProviderInit('communication', code, shouldInit);
  }

}

module.exports = Whisper;
