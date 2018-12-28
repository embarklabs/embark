const serveStatic = require("serve-static");
const {canonicalHost, defaultHost, dockerHostSwap} = require("../../utils/host");
const expressWebSocket = require("express-ws");
const express = require("express");
const fs = require("../../core/fs");
const https = require("https");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const helmet = require("helmet");
import async from "async";
import { bold, green, underline } from "colors";

class Server {
  private logger: any;
  private buildDir: any;
  private events: any;
  private port: any;
  private dist: any;
  private hostname: any;
  private isFirstStart: any;
  private opened: any;
  private openBrowser: any;
  private logging: any;
  private plugins: any;
  private enableCatchAll: any;
  private protocol: any;
  private certOptions: any;
  private server: any;
  private app: any;
  private secureServer: any;

  constructor(options: any) {
    this.logger = options.logger;
    this.buildDir = options.buildDir;
    this.events = options.events;
    this.port = options.port || 8000;
    this.dist = options.dist || "dist/";
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.isFirstStart = true;
    this.opened = false;
    this.openBrowser = options.openBrowser;
    this.logging = false;
    this.plugins = options.plugins;
    this.enableCatchAll = options.enableCatchAll;

    this.protocol = options.protocol || "http";
    this.certOptions = options.certOptions;

    this.events.once("outputDone", () => {
      this.logger.info(this._getMessage());
    });
  }

  public enableLogging(callback: any) {
    this.logging = true;
    return callback(null, __("Enabled Webserver Logs"));
  }

  public disableLogging(callback: any) {
    this.logging = false;
    return callback(null, __("Disabled Webserver Logs"));
  }

  public start(callback: any) {
    callback = callback || (() => {});
    const self = this;
    if (this.server && this.server.listening) {
      const message = __("a webserver is already running at") + " " +
        green(bold(underline("http://" + canonicalHost(this.hostname) + ":" + this.port)));
      return callback(null, message);
    }

    const coverage = serveStatic(fs.dappPath("coverage/__root__/"), {index: ["index.html", "index.htm"]});
    const coverageStyle = serveStatic(fs.dappPath("coverage/"));
    const main = serveStatic(this.buildDir, {index: ["index.html", "index.htm"]});

    this.app = express();
    this.secureServer = this.protocol === "https" ? https.createServer(self.certOptions, (req: any, res: any) => self.app.handle(req, res)) : null;
    const expressWs = this.protocol === "https" ? expressWebSocket(this.app, this.secureServer) : expressWebSocket(this.app);

    // Assign Logging Function
    this.app.use((req: any, res: any, next: any) => {
      if (self.logging) {
        if (!req.headers.upgrade) {
          console.log("Webserver> " + req.method + " " + req.originalUrl);
        }
      }
      next();
    });

    this.app.use(helmet.noCache());
    this.app.use(cors());
    this.app.use(main);
    this.app.use("/coverage", coverage);
    this.app.use(coverageStyle);

    this.app.use(express.static(path.join(fs.dappPath(this.dist)), {index: ["index.html", "index.htm"]}));
    this.app.use("/embark", express.static(path.join(__dirname, "../../../../embark-ui/build")));

    this.app.use(bodyParser.json()); // support json encoded bodies
    this.app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    this.app.ws("/logs", (ws: any, _req: any) => {
      this.events.on("log", (logLevel: any, logMsg: any) => {
        ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel}), () => {});
      });
    });

    if (self.plugins) {
      const apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
      this.app.get("/embark-api/plugins", (req: any, res: any) => {
        res.send(JSON.stringify(self.plugins.plugins.map((plugin: any) => {
          return {name: plugin.name};
        })));
      });

      for (const apiCall of apiCalls) {
        this.app[apiCall.method].apply(this.app, [apiCall.endpoint, this.applyAPIFunction.bind(this, apiCall.cb)]);
      }
    }

    this.app.ws("/", () => {});
    const wss = expressWs.getWss("/");

    self.events.on("outputDone", () => {
      wss.clients.forEach((client: any) => {
        client.send("outputDone");
      });
    });

    self.events.on("outputError", () => {
      wss.clients.forEach((client: any) => {
        client.send("outputError");
      });
    });

    this.events.on("plugins:register:api", (apiCall: any) => {
      self.app[apiCall.method].apply(self.app, [apiCall.endpoint, this.applyAPIFunction.bind(this, apiCall.cb)]);
    });

    this.app.get("/embark/*", (req: any, res: any) => {
      self.logger.trace("webserver> GET " + req.path);
      res.sendFile(path.join(__dirname, "../../../../embark-ui/build", "index.html"));
    });

    if (this.enableCatchAll === true) {
      this.app.get("/*", (req: any, res: any) => {
        self.logger.trace("webserver> GET " + req.path);
        res.sendFile(path.join(fs.dappPath(self.dist, "index.html")));
      });
    }

    async.waterfall([
      function createPlaceholderPage(next: any) {
        if (!self.isFirstStart) {
          return next();
        }
        self.isFirstStart = false;
        self.events.request("build-placeholder", next);
      },
      function listen(next: any) {
        if (self.protocol === "https") {
          return self.server = self.secureServer.listen(self.port, self.hostname, () => {
            self.port = self.secureServer.address().port;
            next();
          });
        }
        self.server = self.app.listen(self.port, self.hostname, () => {
          self.port = self.server.address().port;
          next();
        });
      },
      function openBrowser(next: any) {
        if (!self.openBrowser || self.opened) {
          return next();
        }
        self.opened = true;
        self.events.request("open-browser", next);
      },
    ], (err: any) => {
      if (err) {
        return callback(err);
      }

      callback(null, self._getMessage(), self.port);
    });
  }

  private _getMessage() {
    return __("webserver available at") + " " +
    green(underline(bold(this.protocol + "://" + canonicalHost(this.hostname) + ":" + this.port)));
  }

  private applyAPIFunction(cb: any, req: any, res: any) {
    this.events.request("authenticator:authorize", req, res, (err: any) => {
      if (err) {
        const send = res.send ? res.send.bind(res) : req.send.bind(req); // WS only has the first params
        return send(err);
      }
      cb(req, res);
    });
  }

  public stop(callback: any) {
    callback = callback || (() => {});
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.close(() => {
      callback(null, __("Webserver stopped"));
    });
  }
}

export default Server;
