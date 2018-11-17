const async = require('async');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
const expressWebSocket = require('express-ws');
const express = require('express');
const fs = require('../../core/fs');
require('http-shutdown').extend();
var cors = require('cors');
let path = require('path');
var bodyParser = require('body-parser');
const helmet = require('helmet');

class Server {
  constructor(options) {
    this.logger = options.logger;
    this.buildDir = options.buildDir;
    this.events = options.events;
    this.port = options.port || 8000;
    this.dist = options.dist || 'dist/';
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.isFirstStart = true;
    this.opened = false;
    this.openBrowser = options.openBrowser;
    this.logging = false;
    this.plugins = options.plugins;
    this.enableCatchAll = options.enableCatchAll;

    this.events.once('outputDone', () => {
      this.logger.info(this._getMessage());
    });
  }

  enableLogging(callback) {
    this.logging = true;
    return callback(null, __("Enabled Webserver Logs"));
  }

  disableLogging(callback) {
    this.logging = false;
    return callback(null, __("Disabled Webserver Logs"));
  }

  start(callback) {
    callback = callback || function() {};
    const self = this;
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
        ("http://" + canonicalHost(this.hostname) +
          ":" + this.port).bold.underline.green;
      return callback(null, message);
    }

    const coverage = serveStatic(fs.dappPath('coverage/__root__/'), {'index': ['index.html', 'index.htm']});
    const coverageStyle = serveStatic(fs.dappPath('coverage/'));
    const main = serveStatic(this.buildDir, {'index': ['index.html', 'index.htm']});

    this.app = express();
    const expressWs = expressWebSocket(this.app);
    // Assign Logging Function
    this.app.use(function(req, res, next) {
      if (self.logging) {
        if (!req.headers.upgrade) {
          console.log('Webserver> ' + req.method + " " + req.originalUrl);
        }
      }
      next();
    });

    this.app.use(helmet.noCache());
    this.app.use(cors());
    this.app.use(main);
    this.app.use('/coverage', coverage);
    this.app.use(coverageStyle);

    this.app.use(express.static(path.join(fs.dappPath(this.dist)), {'index': ['index.html', 'index.htm']}));
    this.app.use('/embark', express.static(path.join(__dirname, '../../../../embark-ui/build')));

    this.app.use(bodyParser.json()); // support json encoded bodies
    this.app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    this.app.ws('/logs', function(ws, _req) {
      self.events.on("log", function(logLevel, logMsg) {
        ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel: logLevel}), () => {});
      });
    });

    if (self.plugins) {
      let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
      this.app.get('/embark-api/plugins', function(req, res) {
        res.send(JSON.stringify(self.plugins.plugins.map((plugin) => {
          return {name: plugin.name};
        })));
      });

      for (let apiCall of apiCalls) {
        this.app[apiCall.method].apply(this.app, [apiCall.endpoint, this.applyAPIFunction.bind(this, apiCall.cb)]);
      }
    }

    this.app.ws('/', () => {});
    const wss = expressWs.getWss('/');

    self.events.on('outputDone', () => {
      wss.clients.forEach(function(client) {
        client.send('outputDone');
      });
    });

    self.events.on('outputError', () => {
      wss.clients.forEach(function(client) {
        client.send('outputError');
      });
    });

    this.events.on('plugins:register:api', (apiCall) => {
      self.app[apiCall.method].apply(self.app, [apiCall.endpoint, this.applyAPIFunction.bind(this, apiCall.cb)]);
    });

    this.app.get('/embark/*', function(req, res) {
      self.logger.trace('webserver> GET ' + req.path);
      res.sendFile(path.join(__dirname, '../../../../embark-ui/build', 'index.html'));
    });

    if (this.enableCatchAll === true) {
      this.app.get('/*', function(req, res) {
        self.logger.trace('webserver> GET ' + req.path);
        res.sendFile(path.join(fs.dappPath(self.dist, 'index.html')));
      });
    }

    async.waterfall([
      function createPlaceholderPage(next) {
        if (!self.isFirstStart) {
          return next();
        }
        self.isFirstStart = false;
        self.events.request('build-placeholder', next);
      },
      function listen(next) {
        self.server = self.app.listen(self.port, self.hostname, () => {
          self.port = self.server.address().port;
          next();
        });
      },
      function openBrowser(next) {
        if (!self.openBrowser || self.opened) {
          return next();
        }
        self.opened = true;
        self.events.request('open-browser', next);
      }
    ], function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, self._getMessage(), self.port);
    });
  }

  _getMessage() {
    return __('webserver available at') + ' ' +
    ('http://' + canonicalHost(this.hostname) + ':' + this.port).bold.underline.green;
  }

  applyAPIFunction(cb, req, res) {
    this.events.request('authenticator:authorize', req, res, (err) => {
      if (err) {
        const send = res.send ? res.send.bind(res) : req.send.bind(req); // WS only has the first params
        return send(err);
      }
      cb(req, res);
    });
  }

  stop(callback) {
    callback = callback || function () {};
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.close(function() {
      callback(null, __("Webserver stopped"));
    });
  }
}

module.exports = Server;
