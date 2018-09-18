const async = require('async');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
const express = require('express');
const fs = require('../../core/fs');
require('http-shutdown').extend();

class Server {
  constructor(options) {
    this.buildDir = options.buildDir;
    this.events = options.events;
    this.port = options.port || 8000;
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.isFirstStart = true;
    this.opened = false;
  }

  start(callback) {
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
    this.app.use(main);
    this.app.use('/coverage', coverage);
    this.app.use(coverageStyle);

    const self = this;

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
        if (self.opened) {
          return next();
        }
        self.opened = true;
        self.events.request('open-browser', next);
      }
    ], function (err) {
      if (err) {
        return callback(err);
      }
      const msg = (
        __('webserver available at') + ' ' +
          ('http://' + canonicalHost(self.hostname) + ':' + self.port).bold.underline.green
      );
      callback(null, msg, self.port);
    });
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
