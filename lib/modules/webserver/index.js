var utils = require('../../utils/utils.js');
var Server = require('./server.js');

class WebServer {

  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.addCheck = options.addCheck;
    this.webServerConfig = embark.config.webServerConfig;
    if (!this.webServerConfig.enabled) {
      return;
    }

    this.host = options.host || this.webServerConfig.host;
    this.port = options.port || this.webServerConfig.port;

    this.events.emit("status", "Starting Server");
    this.server = new Server({logger: this.logger, host: this.host, port: this.port});

    this.setServiceCheck();
    this.listenToCommands();
    this.registerConsoleCommands();

    this.server.start();
  }

  setServiceCheck() {
    let url = 'http://' + this.host + ':' + this.port;

    //embark.registerServiceCheck('WebserverService', function (cb) {
    this.addCheck('Webserver', function (cb) {
      utils.checkIsAvailable(url, function (available) {
        let devServer = 'Webserver (' + url + ')';
        let serverStatus = (available ? 'on' : 'off');
        return cb({name: devServer, status: serverStatus});
      });
    });

    this.events.on('check:wentOffline:Webserver', () => {
      this.logger.info("Webserver is offline");
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('start-webserver', () => { this.server.start(); });
    this.events.setCommandHandler('stop-webserver',  () => { this.server.stop();  });
  }

  registerConsoleCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      if (cmd === 'webserver start') {
        self.events.request("start-webserver");
        return " ";
      }
      if (cmd === 'webserver stop') {
        self.events.request("stop-webserver");
        return "stopping webserver...";
      }
      return false;
    });
  }

}

module.exports = WebServer;
