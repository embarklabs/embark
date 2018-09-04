let finalhandler = require('finalhandler');
const async = require('async');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
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
    let serve = serveStatic(this.buildDir, {'index': ['index.html', 'index.htm']});

    this.server = http.createServer(function onRequest(req, res) {
      serve(req, res, finalhandler(req, res));
    }).withShutdown();

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
        self.server.listen(self.port, self.hostname, () => {
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
    this.server.shutdown(function() {
      callback(null, __("Webserver stopped"));
    });
  }
}

module.exports = Server;
