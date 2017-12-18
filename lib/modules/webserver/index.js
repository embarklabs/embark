var utils = require('../../utils/utils.js');
var Server = require('./server.js');

class WebServer {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.addCheck = options.addCheck;

    let self = this;
    let webServerConfig = embark.config.webServerConfig;
    if (!webServerConfig.enabled) {
      return;
    }

    let host = options.host || webServerConfig.host;
    let port = options.port || webServerConfig.port;

    this.logger.setStatus("Starting Server");
    let server = new Server({
      logger: this.logger,
      host: host,
      port: port
    });

    //embark.registerServiceCheck('WebserverService', function (cb) {
    this.addCheck('Webserver', function (cb) {
      utils.checkIsAvailable('http://' + host + ':' + port, function (available) {
        let devServer = 'Webserver (http://' + host + ':' + port + ')';
        if (available) {
          return cb({name: devServer, status: 'on'});
        } else {
          return cb({name: devServer, status: 'off'});
        }
      });
    });

    self.events.on('check:wentOffline:Webserver', function () {
      self.logger.info("Webserver is offline");
    });

    self.events.setCommandHandler('start-webserver', function() {
      server.start();
    });

    self.events.setCommandHandler('stop-webserver', function() {
      server.stop();
    });

    server.start(function () {
    });
  }

}

module.exports = WebServer;
