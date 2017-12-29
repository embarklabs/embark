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
      self.web3.version.getWhisper(function (err, version) {
        if (err) {
          return cb({name: 'Whisper', status: 'off'});
        } else {
          return cb({name: 'Whisper (version ' + version + ')', status: 'on'});
        }
      });
    });
  }

  addWhisperToEmbarkJS() {
    // TODO: make this a shouldAdd condition
    if (this.communicationConfig === {}) {
      return;
    }
    if ((this.communicationConfig.available_providers.indexOf('whisper') < 0) && (this.communicationConfig.provider !== 'whisper' || this.communicationConfig.enabled !== true)) {
      return;
    }

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkWhisper);";

    this.embark.addCodeToEmbarkJS(code);
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
