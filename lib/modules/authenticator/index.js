const uuid = require('uuid/v1');

class Authenticator {

  constructor(embark, _options) {
    this.authToken = uuid();
    this.embark = embark;
    this.logger = embark.logger;

    this.registerCalls();
    embark.events.once('outputDone', () => {
      embark.logger.info(__('Access the web backend with the following url: %s',
        ('http://localhost:8000/embark?token=' + this.authToken).underline));
    });
  }

  registerCalls() {
    this.embark.registerAPICall(
      'post',
      '/embark-api/authenticate',
      (req, res) => {
        if (req.body.token !== this.authToken) {
          this.logger.warn(__('Someone tried and failed to authenticate to the backend'));
          this.logger.warn(__('- User-Agent: %s', req.headers['user-agent']));
          this.logger.warn(__('- Referer: %s', req.headers.referer));
          return res.status(403).send({error: __('Wrong authentication token')});
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
}

module.exports = Authenticator;
