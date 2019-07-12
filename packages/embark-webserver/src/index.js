import { __ } from 'embark-i18n';
import {joinPath, canonicalHost, checkIsAvailable/*, findNextPort*/} from 'embark-utils';
var Server = require('./server.js');
const open = require('open');

require('ejs');
const Templates = {
  embark_building_placeholder: require('./templates/embark-building-placeholder.html.ejs')
};

class WebServer {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
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
    this.isServiceRegistered = false;

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
      fs: this.fs,
      openBrowser: this.webServerConfig.openBrowser,
      protocol: this.webServerConfig.protocol,
      certOptions : this.webServerConfig.certOptions
    });

    this.listenToCommands();
    this.registerConsoleCommands();
    this.init();
  }

  init() {
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
            this.events.request('browser:open', () => {});
          });
        });
      });
    });

    // findNextPort(this.port).then((newPort) => {
    //   this.server.port = newPort;
    //   this.events.request('processes:launch', 'webserver', (_err, message, port) => {
    //     this.logger.info(message);
    //     this.port = port;
    //   });
    // });
    this.setServiceCheck();

    this.events.on('check:wentOffline:Webserver', () => {
      this.logger.info(__("Webserver is offline"));
    });
    this.events.on('check:backOnline:Webserver', () => {
      this.logger.info(__("Webserver is online"));
    });
  }

  setServiceCheck() {
    if (!this.isServiceRegistered) {
      this.isServiceRegistered = true;
      this.events.request("services:register", 'Webserver', (cb) => {
        let url = this.protocol + '://' + canonicalHost(this.host) + ':' + this.port;
        checkIsAvailable(url, function (available) {
          let devServer = __('Webserver') + ' (' + url + ')';
          let serverStatus = (available ? 'on' : 'off');
          return cb({name: devServer, status: serverStatus});
        });
      });
    }
  }

  listenToCommands() {
    this.events.setCommandHandler('placeholder:build', (cb) => this.buildPlaceholderPage(cb));
    this.events.setCommandHandler('browser:open', (cb) => this.openBrowser(cb));
    // TODO: remove this in v5
    this.events.setCommandHandler('webserver:start', (cb) => {
      this.logger.warn(__("The event 'webserver:start' has been deprecated and will be removed in future versions."));
      this.events.request('processes:launch', 'webserver', cb);
    });
    // TODO: remove this in v5
    this.events.setCommandHandler('webserver:stop',  (cb) => {
      this.logger.warn(__("The event 'webserver:stop' has been deprecated and will be removed in future versions."));
      this.events.request('processes:stop', 'webserver', cb);
    });
    this.events.setCommandHandler('logs:webserver:enable',  (cb) => this.server.enableLogging(cb));
    this.events.setCommandHandler('logs:webserver:disable',  (cb) => this.server.disableLogging(cb));
  }

  // TODO: remove this in v5
  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      usage: "webserver start/stop",
      description: __("Start or stop the websever"),
      matches: ['webserver start'],
      process: (cmd, callback) => {
        const message = __("The command 'webserver:start' has been deprecated in favor of 'service webserver on' and will be removed in future versions.");
        this.logger.warn(message); // logs to Embark's console
        this.events.request('processes:launch', 'webserver', (_err, msg) => {
          callback(_err || msg); // logs to Cockpit's console
        });
      }
    });

    // TODO: remove this in v5
    this.embark.registerConsoleCommand({
      matches: ['webserver stop'],
      process: (cmd, callback) => {
        const message = __("The command 'webserver:stop' has been deprecated in favor of 'service webserver off' and will be removed in future versions.");
        this.logger.warn(message); // logs to Embark's console
        this.events.request('processes:stop', 'webserver', (_err, msg) => {
          callback(_err || msg); // logs to Cockpit's console
        });
      }
    });

    this.embark.registerConsoleCommand({
      description: __("Open a browser window at the Dapp's url"),
      matches: ['browser open'],
      process: (cmd, callback) => {
        this.events.request('browser:open', callback);
      }
    });

    this.embark.registerConsoleCommand({
      matches: ['log webserver on'],
      process: (cmd, callback) => {
        this.events.request('logs:webserver:enable', callback);
      }
    });

    this.embark.registerConsoleCommand({
      matches: ['log webserver off'],
      process: (cmd, callback) => {
        this.events.request('logs:webserver:disable', callback);
      }
    });
  }

  buildPlaceholderPage(cb) {
    let html = Templates.embark_building_placeholder({buildingMsg: __('Embark is building, please wait...')});
    this.fs.mkdirpSync(this.buildDir); // create buildDir if it does not exist
    this.fs.writeFile(joinPath(this.buildDir, 'index.html'), html, cb);
  }

  openBrowser(cb) {
    const _cb = () => { cb(); };
    return open(
      `${this.protocol}://${canonicalHost(this.server.hostname)}:${this.server.port}`
    ).then(_cb, _cb); // fail silently, e.g. in a docker container
  }
}

module.exports = WebServer;
