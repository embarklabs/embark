let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();

class Server {
  constructor(options) {
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.logger = options.logger;
  }

  start(callback) {
    if (this.server && this.server.listening) {
      this.logger.warn(__("a webserver is already running at") +
                       " " +
                       ("http://" + canonicalHost(this.hostname) +
                        ":" + this.port).bold.underline.green);
      if (callback) {
        callback();
      }
      return;
    }
    let serve = serveStatic(this.dist, {'index': ['index.html', 'index.htm']});

    this.server = http.createServer(function onRequest(req, res) {
      serve(req, res, finalhandler(req, res));
    }).withShutdown();

    this.logger.info(__("webserver available at") +
                     " " +
                     ("http://" + canonicalHost(this.hostname) +
                      ":" + this.port).bold.underline.green);
    this.server.listen(this.port, this.hostname);
    if (callback) {
      callback();
    }
  }

  stop(callback) {
    if (!this.server || !this.server.listening) {
      this.logger.warn(__("no webserver is currently running"));
      if (callback) {
        callback();
      }
      return;
    }
    this.server.shutdown(function() {
      if (callback) {
        callback();
      }
    });
  }

}

module.exports = Server;
