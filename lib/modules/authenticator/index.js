const uuid = require('uuid/v1');

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

  registerCalls() {
    this.embark.registerAPICall(
      'post',
      '/embark-api/authorize',
      (req, res) => {
        if (req.body.token !== this.authToken) {
          this.logger.warn(__('Someone tried and failed to authorize to the backend'));
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
          callback(null, __('Your authorisation token: %s', this.authToken));
        }
      };
    });
  }

  registerEvents() {
    this.events.once('outputDone', () => {
      const {port, host} = this.embark.config.webServerConfig;
      this.logger.info(__('Access the web backend with the following url: %s',
        (`http://${host}:${port}/embark?token=${this.authToken}`.underline)));
    });

    this.events.setCommandHandler('api:authorize', (token, cb) => {
      if (token !== this.authToken) {
        return cb(ERROR_OBJ);
      }
      cb();
    });
  }
}

module.exports = Authenticator;
