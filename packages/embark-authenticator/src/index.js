const uuid = require('uuid/v4');
import { __ } from 'embark-i18n';
const {copyToClipboard} = require("embark-utils");
const keccak = require('keccakjs');

const ERROR_OBJ = {error: __('Wrong authentication token. Get your token from the Embark console by typing `token`')};

class Authenticator {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.singleUseToken = options.singleUseAuthToken;

    this.authToken = uuid();
    this.emittedTokens = {};

    this.registerCalls();
    this.registerEvents();
  }

  getRemoteAddress(req) {
    return (req.headers && req.headers['x-forwarded-for']) ||
      (req.connection && req.connection.remoteAddress) ||
      (req.socket && req.socket.remoteAddress) ||
      (req._socket && req._socket.remoteAddress);
  }

  generateRequestHash(req, token) {
    const remoteAddress = this.getRemoteAddress(req);
    const cnonce = req.headers['x-embark-cnonce'];

    // We fallback to an empty string so that the hashing won't fail.
    token = token || this.emittedTokens[remoteAddress] || '';

    let url = req.url;
    const queryParamIndex = url.indexOf('?');
    url = url.substring(0, queryParamIndex !== -1 ? queryParamIndex : url.length);

    let hash = new keccak();
    hash.update(cnonce);
    hash.update(token);
    hash.update(req.method.toUpperCase());
    hash.update(url);
    return hash.digest('hex');
  }

  registerCalls() {
    let self = this;

    this.embark.registerAPICall(
      'post',
      '/embark-api/authenticate',
      (req, res) => {
        let hash = self.generateRequestHash(req, this.authToken);
        if(hash !== req.headers['x-embark-request-hash']) {
          this.logger.warn(__('Someone tried and failed to authenticate to the backend'));
          this.logger.warn(__('- User-Agent: %s', req.headers['user-agent']));
          this.logger.warn(__('- Referer: %s', req.headers.referer));
          return res.send(ERROR_OBJ);
        }

        let emittedToken;
        if (this.singleUseToken) {
          // Generate another authentication token.
          this.authToken = uuid();
          this.events.request('authenticator:url:display', false);
          emittedToken = uuid();
        } else {
          emittedToken = this.authToken;
        }

        // Register token for this connection, and send it through.
        const remoteAddress = this.getRemoteAddress(req);
        this.emittedTokens[remoteAddress] = emittedToken;
        res.send({token: emittedToken});
      }
    );

    this.embark.registerConsoleCommand({
      matches: ["token"],
      description: __("Copies and prints the token for the cockpit"),
      process: (cmd, callback) => {
        copyToClipboard(this.authToken);
        callback(null, __('Token copied to clipboard: %s', this.authToken));
      }
    });
  }

  registerEvents() {
    this.events.once('outputDone', () => {
      this.events.request('authenticator:url:display', true);
    });

    this.events.setCommandHandler('authenticator:url:display', (firstOutput) => {
      if(!firstOutput) this.logger.info(__('Previous token has now been used.'));
      this.events.request('api:url', (apiUrl) => {
        this.logger.info(__('Enter the Cockpit with the following url: %s', (`${apiUrl}?token=${this.authToken}`.underline)));
      });
    });

    this.events.setCommandHandler('authenticator:authorize', (req, res, cb) => {
      // HACK
      if(res.send && req.url === '/embark-api/authenticate') return cb();

      let authenticated = false;

      if(!res.send) {
        const [cnonce, hash] = req.protocol.split('|');
        const computedHash = this.generateRequestHash({
            headers: {
              'x-forwarded-for': this.getRemoteAddress(req),
              'x-embark-cnonce': cnonce
            },
            url: '/embark-api/',
            method: 'ws'
        });
        authenticated = (hash === computedHash);
      } else {
        const hash = this.generateRequestHash(req);
        authenticated = (hash === req.headers['x-embark-request-hash']);
      }

      if(authenticated) return cb();
      cb(ERROR_OBJ);
    });
  }
}

module.exports = Authenticator;
