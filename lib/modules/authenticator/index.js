const uuid = require('uuid/v1');

class Authenticator {

  constructor(embark, _options) {
    this.authToken = uuid();


    embark.events.once('outputDone', () => {
      embark.logger.info(__('Access the web backend with the following url: %s',
        ('http://localhost:8000/embark?token=' + this.authToken).underline));
    });

    embark.registerAPICall(
      'post',
      '/embark-api/authenticate',
      (req, res) => {
        if (req.body.token !== this.authToken) {
          embark.logger.warn(__('Someone tried and failed to authenticate to the backend'));
          embark.logger.warn(__('- User-Agent: %s', req.headers['user-agent']));
          embark.logger.warn(__('- Referer: %s', req.headers.referer));
          return res.status(403).send({error: __('Wrong authentication token')});
        }
        res.send();
      }
    );
  }
}

module.exports = Authenticator;
