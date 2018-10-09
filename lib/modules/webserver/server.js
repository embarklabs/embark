const async = require('async');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
const expressWebSocket = require('express-ws');
const express = require('express');
const fs = require('../../core/fs');
require('http-shutdown').extend();

class Server {
  constructor(options) {
    this.logger = options.logger;
    this.buildDir = options.buildDir;
    this.events = options.events;
    this.port = options.port || 8000;
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.isFirstStart = true;
    this.opened = false;
    this.openBrowser = options.openBrowser;


    this.events.once('outputDone', () => {
      this.logger.info(this._getMessage());
    });
  }

  start(callback) {
    const self = this;
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
          ("http://" + canonicalHost(this.hostname) +
           ":" + this.port).bold.underline.green;
      return callback(null, message);
    }

    const coverage = serveStatic(fs.dappPath('coverage/__root__/'), {'index': ['index.html', 'index.htm']});
    const coverageStyle = serveStatic(fs.dappPath('coverage/'));
    const main = serveStatic(this.buildDir, {'index': ['index.html', 'index.htm']});

    this.app = express();
    const expressWs = expressWebSocket(this.app);

    this.app.use(main);
    this.app.use('/coverage', coverage);
    this.app.use(coverageStyle);

    this.app.ws('/', (_ws, _req) => {});
    const wss = expressWs.getWss('/');

    self.events.on('outputDone', () => {
      wss.clients.forEach(function (client) {
        client.send('outputDone');
      });
    });

    self.events.on('outputError', () => {
      wss.clients.forEach(function (client) {
        client.send('outputError');
      });
    });

    async.waterfall([
      function createPlaceholderPage(next) {
        if (!self.isFirstStart) {
          return next();
        }
        self.isFirstStart = false;
        self.events.request('build-placeholder', next);
      },
      function listen(next) {
        self.server = self.app.listen(self.port, self.hostname, () => {
          self.port = self.server.address().port;
          next();
        });
      },
      function openBrowser(next) {
        if (!self.openBrowser || self.opened) {
          return next();
        }
        self.opened = true;
        self.events.request('open-browser', next);
      }
    ], function (err) {
      if (err) {
        return callback(err);
      }

      callback(null, self._getMessage(), self.port);
    });
  }

  _getMessage() {
    return __('webserver available at') + ' ' +
    ('http://' + canonicalHost(this.hostname) + ':' + this.port).bold.underline.green;
  }

  stop(callback) {
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.close(function() {
      callback(null, __("Webserver stopped"));
    });
  }
}

module.exports = Server;
