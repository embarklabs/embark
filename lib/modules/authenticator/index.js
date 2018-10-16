const uuid = require('uuid/v1');
const utils = require("../../utils/utils.js")
const keccak = require('keccakjs');

const ERROR_OBJ = {error: __('Wrong authentication token. Get your token from the Embark console by typing `token`')};

class Authenticator {
  constructor(embark, _options) {
    this.authToken = uuid();
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.registerCalls();
    this.registerEvents();
  }

  generateRequestHash(req) {
    let cnonce = req.headers['x-embark-cnonce'];
    let hash = new keccak();
    hash.update(cnonce);
    hash.update(this.authToken);
    hash.update(req.method);
    hash.update(req.url);
    return hash.digest('hex');
  }

  registerCalls() {
    let self = this;

    this.embark.registerAPICall(
      'post',
      '/embark-api/authenticate',
      (req, res) => {
        let hash = self.generateRequestHash(req);
        if(hash !== req.headers['x-embark-request-hash']) {
          this.logger.warn(__('Someone tried and failed to authenticate to the backend'));
          this.logger.warn(__('- User-Agent: %s', req.headers['user-agent']));
          this.logger.warn(__('- Referer: %s', req.headers.referer));
          return res.send(ERROR_OBJ);
        }
        res.send();
      }
    );

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === "token",
        process: (callback) => {
          callback(null, __('Your authentication token: %s \nYou can use the command `copytoken` to copy the authentication token to your clipboard', this.authToken));
        }
      };
    });

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === "copytoken",
        process: (callback) => {
          utils.copyToClipboard(this.authToken)
          callback(null, __('Token copied to clipboard: %s', this.authToken));
        }
      };
    });

  }

  registerEvents() {
    let self = this;

    this.events.once('outputDone', () => {
      const {port, host} = this.embark.config.webServerConfig;
      this.logger.info(__('Access the web backend with the following url: %s',
        (`http://${host}:${port}/embark?token=${this.authToken}`.underline)));
    });

    this.events.setCommandHandler('authenticator:authorize', (req, cb) => {
      let hash = self.generateRequestHash(req);
      if(hash !== req.headers['x-embark-request-hash']) {
        return cb(ERROR_OBJ);
      }
      cb();
    });
  }
}

module.exports = Authenticator;
