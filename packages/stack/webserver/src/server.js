const async = require('async');
let serveStatic = require('serve-static');
import { __ } from 'embark-i18n';
import {canonicalHost, dappPath, defaultHost, dockerHostSwap} from 'embark-utils';
const expressWebSocket = require('express-ws');
const express = require('express');
const https = require('https');
let path = require('path');

class Server {
  constructor(options) {
    this.logger = options.logger;
    this.buildDir = options.buildDir;
    this.events = options.events;
    this.port = options.port || 8000;
    this.dist = options.dist || 'dist/';
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.isFirstStart = true;
    this.opened = false;
    this.fs = options.fs;
    this.openBrowser = options.openBrowser;
    this.logging = false;
    this.enableCatchAll = options.enableCatchAll;

    this.protocol = options.protocol || 'http';
    this.certOptions = options.certOptions;

    this.events.once('outputDone', () => {
      this.logger.info(this._getMessage());
    });
  }

  enableLogging(callback) {
    this.logging = true;
    return callback(null, __("Enabled Webserver Logs"));
  }

  disableLogging(callback) {
    this.logging = false;
    return callback(null, __("Disabled Webserver Logs"));
  }

  start(callback) {
    callback = callback || function() {};
    const self = this;
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
        ("http://" + canonicalHost(this.hostname) +
          ":" + this.port).bold.underline.green;
      return callback(null, message);
    }

    const coverage = serveStatic(dappPath('coverage/__root__/'), {'index': ['index.html', 'index.htm']});
    const coverageStyle = serveStatic(dappPath('coverage/'));
    const main = serveStatic(this.buildDir, {'index': ['index.html', 'index.htm']});

    this.app = express();
    this.secureServer = this.protocol === 'https' ? https.createServer(self.certOptions, (req, res) => self.app.handle(req, res)) : null;
    const expressWs = this.protocol === 'https' ? expressWebSocket(this.app, this.secureServer) : expressWebSocket(this.app);

    // Assign Logging Function
    this.app.use(function(req, res, next) {
      if (self.logging) {
        if (!req.headers.upgrade) {
          console.log('Webserver> ' + req.method + " " + req.originalUrl);
        }
      }
      next();
    });

    this.app.use(main);
    this.app.use('/coverage', coverage);
    this.app.use(coverageStyle);

    this.app.use(express.static(path.join(dappPath(this.dist)), {'index': ['index.html', 'index.htm']}));

    this.app.ws('/', () => {});
    const wss = expressWs.getWss('/');

    self.events.on('outputDone', () => {
      wss.clients.forEach(function(client) {
        client.send('outputDone');
      });
    });

    self.events.on('outputError', () => {
      wss.clients.forEach(function(client) {
        client.send('outputError');
      });
    });

    if (this.enableCatchAll === true) {
      this.app.get('/*', function(req, res) {
        self.logger.trace('webserver> GET ' + req.path);
        res.sendFile(path.join(dappPath(self.dist, 'index.html')));
      });
    }

    async.waterfall([
      function createPlaceholderPage(next) {
        if (!self.isFirstStart) {
          return next();
        }
        self.isFirstStart = false;
        self.events.request('placeholder:build', next);
      },
      function listen(next) {
        if (self.protocol === 'https'){
          self.server = self.secureServer.listen(self.port, self.hostname, () => {
            self.port = self.secureServer.address().port;
            next();
          });
        }
        else{
          self.server = self.app.listen(self.port, self.hostname, () => {
            self.port = self.server.address().port;
            next();
          });
        }
      },
      function openBrowser(next) {
        if (!self.openBrowser || self.opened) {
          return next();
        }
        self.opened = true;
        self.events.request('browser:open', next);
      }
    ], function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, self._getMessage(), self.port);
    });
  }

  _getMessage() {
    return __('webserver available at') + ' ' +
    (this.protocol + '://' + canonicalHost(this.hostname) + ':' + this.port).bold.underline.green;
  }

  stop(callback) {
    callback = callback || function () {};
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.close(function() {
      callback(null, __("Webserver stopped"));
    });
  }
}

module.exports = Server;
