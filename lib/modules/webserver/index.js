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
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.webServerConfig = embark.config.webServerConfig;
    if (!this.webServerConfig.enabled) {
      return;
    }

    this.host = options.host || this.webServerConfig.host;
    this.port = options.port || this.webServerConfig.port;

    this.events.emit("status", __("Starting Server"));

    this.server = new Server({
      buildDir: this.buildDir,
      events: this.events,
      host: this.host,
      port: this.port
    });

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
    this.events.setCommandHandler('build-placeholder', (cb) => this.buildPlaceholderPage(cb));
    this.events.setCommandHandler('open-browser', (cb) => this.openBrowser(cb));
    this.events.setCommandHandler('start-webserver', (cb) => this.server.start(cb));
    this.events.setCommandHandler('stop-webserver',  (cb) => this.server.stop(cb));
  }

  registerConsoleCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'webserver start',
        process: (cb) => self.events.request('start-webserver', cb)
      };
    });

    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'webserver stop',
        process: (cb) => self.events.request('stop-webserver', cb)
      };
    });

    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'browser open',
        process: (cb) => self.events.request('open-browser', cb)
      };
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
      `http://${canonicalHost(this.server.hostname)}:${this.server.port}`,
      {wait: false}
    ).then(_cb, _cb); // fail silently, e.g. in a docker container
  }
}

module.exports = WebServer;
