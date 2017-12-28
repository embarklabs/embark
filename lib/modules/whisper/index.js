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
    if (this.communicationConfig === {}) {
      return;
    }
    if(this.communicationConfig.provider !== 'whisper' || this.communicationConfig.enabled !== true) {
      return;
    }

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkWhisper);";

    this.embark.addCodeToEmbarkJS(code);
  }
}

module.exports = Whisper;
