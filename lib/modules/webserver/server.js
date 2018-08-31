let finalhandler = require('finalhandler');
const fs = require('../../core/fs.js');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
const opn = require('opn');
const utils = require('../../utils/utils.js');
require('http-shutdown').extend();

require('ejs');
const embark_building_placeholder = require('../code_generator/code_templates/embark-building-placeholder.html.ejs');

class Server {
  constructor(options) {
    this.buildDir = options.buildDir;
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

    if (this.isFirstStart) {
      const html = embark_building_placeholder({buildingMsg: __('Embark is building, please wait...')});
      fs.mkdirpSync(this.dist); // create dist/ folder if not already exists
      fs.writeFileSync(utils.joinPath(this.dist, 'index.html'), html);
      this.isFirstStart = false;
    }

    this.server.listen(this.port, this.hostname, () => {
      this.port = this.server.address().port;
      callback(null, __("webserver available at") +
        " " +
        ("http://" + canonicalHost(this.hostname) +
          ":" + this.port).bold.underline.green, this.port);
      if (!this.opened) {
        // fail silently, e.g. in a docker container, by cacthing promise
        // rejection w/ a noop
        opn(`http://${canonicalHost(this.hostname)}:${this.port}`)
          .catch(function () {});
        this.opened = true;
      }
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
