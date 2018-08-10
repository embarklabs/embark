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

    this.setServiceCheck();
    this.listenToCommands();
    this.registerConsoleCommands();

    let self = this;
    this.server.start((_err, message) => self.logger.info(message));
  }

  setServiceCheck() {
    let url = 'http://' + canonicalHost(this.host) + ':' + this.port;

    this.events.request("services:register", 'Webserver', function (cb) {
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
