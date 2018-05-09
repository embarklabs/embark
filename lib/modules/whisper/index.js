let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');

class Whisper {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.communicationConfig = options.communicationConfig;
    this.addCheck = options.addCheck;
    this.web3 = options.web3;
    this.embark = embark;

    this.setServiceCheck();
    this.addWhisperToEmbarkJS();
    this.addSetProvider();
  }

  setServiceCheck() {
    const self = this;
    self.addCheck('Whisper', function (cb) {
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
      server: connection.host || 'localhost',
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
