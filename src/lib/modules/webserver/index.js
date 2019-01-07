import {findNextPort} from "../../utils/network";

const fs = require('../../core/fs.js');
var {canonicalHost} = require('../../utils/host.js');
var utils = require('../../utils/utils.js');
var Server = require('./server.js');
const opn = require('opn');


require('ejs');
const Templates = {
  embark_building_placeholder: require('./templates/embark-building-placeholder.html.ejs')
};

class WebServer {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = embark.config.buildDir;
    this.webServerConfig = embark.config.webServerConfig;
    if (!this.webServerConfig.enabled) {
      return;
    }

    this.host = this.webServerConfig.host;
    this.protocol = this.webServerConfig.protocol;
    this.port = parseInt(this.webServerConfig.port, 10);
    this.enableCatchAll = this.webServerConfig.enableCatchAll === true;
    this.enableCatchAll = false; // FIXME when true, some Requests end up failing (eg: process-logs)

    this.events.request('processes:register', 'webserver', {
      launchFn: (cb) => { this.server.start(cb); },
      stopFn: (cb) => { this.server.stop(cb); }
    });

    this.events.emit("status", __("Starting Server"));

    this.server = new Server({
      logger: this.logger,
      buildDir: this.buildDir,
      events: this.events,
      host: this.host,
      port: this.port,
      openBrowser: this.webServerConfig.openBrowser,
      protocol: this.webServerConfig.protocol,
      certOptions : this.webServerConfig.certOptions
    });

    this.listenToCommands();
    this.registerConsoleCommands();

    this.events.on('webserver:config:change', () => {
      this.embark.config.webServerConfig = null;
      this.embark.config.loadWebServerConfigFile();
      this.webServerConfig = this.embark.config.webServerConfig;
      this.protocol = this.webServerConfig.protocol;
      this.host = this.webServerConfig.host;
      this.port = this.webServerConfig.port;
      this.server.host = this.host;
      this.server.port = this.port;
      this.server.protocol = this.webServerConfig.protocol;
      this.server.certOptions =  this.webServerConfig.certOptions;

      this.testPort(() => {
        this.events.request('processes:stop', 'webserver', _err => {
          this.events.request('processes:launch', 'webserver', (_err, message, port) => {
            this.logger.info(message);
            this.port = port;
            this.events.request('open-browser', () => {});
          });
        });
      });
    });

    findNextPort(this.port).then((newPort) => {
      this.server.port = newPort;
      this.events.request('processes:launch', 'webserver', (_err, message, port) => {
        this.logger.info(message);
        this.port = port;
        this.setServiceCheck();
      });
    });
  }

  setServiceCheck() {
    const self = this;

    this.events.request("services:register", 'Webserver', function (cb) {
      let url = self.protocol + '://' + canonicalHost(self.host) + ':' + self.port;
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
    this.events.setCommandHandler('build-placeholder', (cb) => this.buildPlaceholderPage(cb));
    this.events.setCommandHandler('open-browser', (cb) => this.openBrowser(cb));
    this.events.setCommandHandler('start-webserver', (cb) => this.events.request('processes:launch', 'webserver', cb));
    this.events.setCommandHandler('stop-webserver',  (cb) => this.events.request('processes:stop', 'webserver', cb));
    this.events.setCommandHandler('logs:webserver:turnOn',  (cb) => this.server.enableLogging(cb));
    this.events.setCommandHandler('logs:webserver:turnOff',  (cb) => this.server.disableLogging(cb));
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      usage: "webserver start/stop",
      description: __("Start or stop the websever"),
      matches: ['webserver start'],
      process: (cmd, callback) => {
        this.events.request('start-webserver', callback);
      }
    });

    this.embark.registerConsoleCommand({
      matches: ['webserver stop'],
      process: (cmd, callback) => {
        this.events.request('stop-webserver', callback);
      }
    });

    this.embark.registerConsoleCommand({
      description: __("Open a browser window at the Dapp's url"),
      matches: ['browser open'],
      process: (cmd, callback) => {
        this.events.request('open-browser', callback);
      }
    });

    this.embark.registerConsoleCommand({
      matches: ['log webserver on'],
      process: (cmd, callback) => {
        this.events.request('logs:webserver:turnOn', callback);
      }
    });

    this.embark.registerConsoleCommand({
      matches: ['log webserver off'],
      process: (cmd, callback) => {
        this.events.request('logs:webserver:turnOff', callback);
      }
    });
  }

  buildPlaceholderPage(cb) {
    let html = Templates.embark_building_placeholder({buildingMsg: __('Embark is building, please wait...')});
    fs.mkdirpSync(this.buildDir); // create buildDir if it does not exist
    fs.writeFile(utils.joinPath(this.buildDir, 'index.html'), html, cb);
  }

  openBrowser(cb) {
    const _cb = () => { cb(); };
    return opn(
      `${this.protocol}://${canonicalHost(this.server.hostname)}:${this.server.port}`,
      {wait: false}
    ).then(_cb, _cb); // fail silently, e.g. in a docker container
  }
}

module.exports = WebServer;
