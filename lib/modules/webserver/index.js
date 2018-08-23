var {canonicalHost} = require('../../utils/host.js');
var utils = require('../../utils/utils.js');
var Server = require('./server.js');

class WebServer {

  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.webServerConfig = embark.config.webServerConfig;
    if (!this.webServerConfig.enabled) {
      return;
    }

    this.host = options.host || this.webServerConfig.host;
    this.port = options.port || this.webServerConfig.port;

    this.events.emit("status", __("Starting Server"));

    this.server = new Server({host: this.host, port: this.port});
    this.testPort(() => {
      this.listenToCommands();
      this.registerConsoleCommands();
      this.server.start((_err, message, port) => {
        this.logger.info(message);
        this.port = port;
        this.setServiceCheck();
      });
    });
  }

  testPort(done) {
    utils.pingEndpoint(this.host, this.port, 'http', 'http', '', (err) => {
      if (err) { // Port is ok
        return done();
      }
      this.logger.warn(__('Webserver already running on port %s. Assigning an available port', this.port));
      this.port = 0;
      this.server.port = 0;
      done();
    });
  }

  setServiceCheck() {
    const self = this;

    this.events.request("services:register", 'Webserver', function (cb) {
      let url = 'http://' + canonicalHost(self.host) + ':' + self.port;
      utils.checkIsAvailable(url, function (available) {
        let devServer = __('Webserver') + ' (' + url + ')';
        let serverStatus = (available ? 'on' : 'off');
        return cb({name: devServer, status: serverStatus});
      });
    });

    this.events.on('check:wentOffline:Webserver', () => {
      this.logger.info(__("Webserver is offline"));
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('start-webserver', (callback) => this.server.start(callback));
    this.events.setCommandHandler('stop-webserver',  (callback) => this.server.stop(callback));
  }

  registerConsoleCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === "webserver start",
        process: (callback) => self.events.request("start-webserver", callback)
      };
    });

    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === "webserver stop",
        process: (callback) => self.events.request("stop-webserver", callback)
      };
    });
  }
}

module.exports = WebServer;
