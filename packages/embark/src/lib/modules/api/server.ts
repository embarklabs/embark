import bodyParser from "body-parser";
import cors from "cors";
import {Embark, Plugins} from "embark";
import express, {NextFunction, Request, Response} from "express";
import proxy from "express-http-proxy";
import expressWs from "express-ws";
import findUp from "find-up";
import helmet from "helmet";
import * as http from "http";
import {__} from "i18n";
import * as path from "path";
import * as ws from "ws";
// @ts-ignore
import {embarkPath, existsSync} from "../../core/fs";

type Method = "get" | "post" | "ws" | "delete";

interface CallDescription {
  method: Method;
  endpoint: string;
  cb(req: Request | ws, res: Response | Request): void;
}

export default class Server {
  private _isInsideMonorepo: boolean | null = null;
  private _monorepoRootDir: string = "";
  private embarkUiBuildDir: string = (
    findUp.sync("node_modules/embark-ui/build", {cwd: embarkPath()}) ||
    embarkPath("node_modules/embark-ui/build")
  );
  private expressInstance: expressWs.Instance;
  private isLogging: boolean = false;
  private server?: http.Server;

  constructor(private embark: Embark, private port: number, private hostname: string, private plugins: Plugins) {
    this.expressInstance = this.initApp();
  }

  public enableLogging() {
    this.isLogging = true;
  }

  public disableLogging() {
    this.isLogging = false;
  }

  private get isInsideMonorepo() {
    if (this._isInsideMonorepo === null) {
      this._isInsideMonorepo = existsSync(embarkPath("../../packages/embark")) &&
        existsSync(embarkPath("../../lerna.json")) &&
        path.resolve(embarkPath("../../packages/embark")) === embarkPath();
    }
    return this._isInsideMonorepo;
  }

  private get monorepoRootDir() {
    if (!this._monorepoRootDir && this.isInsideMonorepo) {
      this._monorepoRootDir = path.resolve(embarkPath("../.."));
    }
    return this._monorepoRootDir;
  }

  public start() {
    return new Promise<void>((resolve, reject) => {
      if (this.server) {
        const message = __("API is already running");
        return reject(new Error(message));
      }

      this.server = this.expressInstance.app.listen(this.port, this.hostname, () => {
        resolve();
      });
    });
  }

  public stop() {
    return new Promise<void>((resolve, reject) => {
      if (!this.server) {
        const message = __("API is not running");
        return reject(new Error(message));
      }

      this.server.close(() => {
        this.server = undefined;
        resolve();
      });
    });
  }

  private makePage(reloadSeconds: number, body: string) {
    return (`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          ${this.isInsideMonorepo ? `
            <meta http-equiv="refresh" content="${reloadSeconds}">
          ` : ""}
          <title>Embark API Server</title>
          <style type="text/css">
            code {
              background-color: rgba(220,220,220,.5);
            }
            ${this.isInsideMonorepo ? `
              #timer {
                background-color: black;
                color: yellow;
                padding: 0.25em;
              }
            ` : ""}
          </style>
        </head>
        <body>
          ${body}
          ${this.isInsideMonorepo ? `
            <p>this page will automatically reload
              in <span id="timer">${reloadSeconds}</span> seconds</p>
            <script>
              let timeLeft = ${reloadSeconds};
              const span = document.querySelector("#timer");
              setInterval(() => {
                if (timeLeft >= 1) { timeLeft -= 1; }
                span.innerText = \`\${timeLeft}\`;
              }, 1000);
            </script>
          ` : ""}
        </body>
      </html>
    `.trim().split("\n").map((str) => str.trim()).filter((str) => str).join("\n"));
  }

  private makePage404(reloadSeconds: number, envReport: string, inside: string, notice: string) {
    return this.makePage(reloadSeconds, `
      ${envReport}
      <p>missing build for package <code>embark-ui</code> ${inside}</p>
      ${notice}
    `);
  }

  private makePageEConnError(reloadSeconds: number, waitingFor: string) {
    return this.makePage(reloadSeconds, `
      <p><code>lib/modules/api/server</code> inside the monorepo at
        <code>${path.join(this.monorepoRootDir, "packages/embark")}</code> is
        waiting for the Create React App development server of package
        <code>embark-ui</code> to ${waitingFor} at
        <code>localhost:55555</code></p>
      ${waitingFor === "become available" ? `
        <p>please run either:</p>
        <p><code>cd ${this.monorepoRootDir} && yarn start</code><br />
          or<br />
          <code>cd ${path.join(this.monorepoRootDir, "packages/embark-ui")}
            && yarn start</code></p>
        <p>to instead use a static build from the monorepo, restart embark with:
          <code>EMBARK_UI_STATIC=t embark run</code></p>
      ` : ""}
    `);
  }

  private initApp() {
    const instance = expressWs(express());
    instance.app.use((req: Request, _res, next: NextFunction) => {
      if (!this.isLogging) {
        return next();
      }

      if (!req.headers.upgrade) {
        this.embark.logger.info(`API > ${req.method} ${req.originalUrl}`);
      }
      next();
    });

    instance.app.use(helmet.noCache());
    instance.app.use(cors());

    instance.app.use(bodyParser.json());
    instance.app.use(bodyParser.urlencoded({extended: true}));

    instance.app.ws("/logs", (websocket: ws, _req: Request) => {
      this.embark.events.on("log", (level: string, message: string) => {
        websocket.send(JSON.stringify({msg: message, msg_clear: message.stripColors, logLevel: level}), () => {});
      });
    });

    if (this.plugins) {
      instance.app.get("/embark-api/plugins", (_req, res: Response) => {
        res.send(JSON.stringify(this.plugins.plugins.map((plugin) => ({name: plugin.name}))));
      });

      const callDescriptions: CallDescription[] = this.plugins.getPluginsProperty("apiCalls", "apiCalls");
      callDescriptions.forEach((callDescription) => this.registerCallDescription(instance, callDescription));
    }

    this.embark.events.on("plugins:register:api", (callDescription: CallDescription) => this.registerCallDescription(instance, callDescription));

    if (!this.isInsideMonorepo || process.env.EMBARK_UI_STATIC) {
      if (existsSync(path.join(this.embarkUiBuildDir, "index.html"))) {
        instance.app.use("/", express.static(this.embarkUiBuildDir));
        instance.app.get("/*", (_req, res) => {
          res.sendFile(path.join(this.embarkUiBuildDir, "index.html"));
        });
      } else {
        let envReport = "";
        let inside = `
          in <code>${path.dirname(this.embarkUiBuildDir)}</code>
        `;
        let notice = `
          <p>this distribution of <code>embark-ui</code> appears to be broken</p>
        `;
        if (this.isInsideMonorepo) {
          envReport = `
            <p><code>process.env.EMBARK_UI_STATIC ===
              ${JSON.stringify(process.env.EMBARK_UI_STATIC)}</code></p>
          `;
          inside = `
            inside the monorepo at <code>
              ${path.join(this.monorepoRootDir, "packages/embark-ui")}</code>
          `;
          notice = `
            <p>to build <code>embark-ui</code> please run either:</p>
            <p><code>cd ${this.monorepoRootDir} && yarn build</code><br />
              or<br />
              <code>cd ${path.join(this.monorepoRootDir, "packages/embark-ui")}
                && yarn build</code></p>
            <p>restart <code>embark run</code> after building
              <code>embark-ui</code></p>
            <p>to instead use a live development build from the monorepo, unset
              the environment variable <code>EMBARK_UI_STATIC</code> and restart
              embark</p>
          `;
        }
        const page404 = this.makePage404(3, envReport, inside, notice);
        const missingBuildHandler = (_req: Request, res: Response) => {
          res.status(404).send(page404);
        };
        instance.app.get("/", missingBuildHandler);
        instance.app.get("/*", missingBuildHandler);
      }
    } else {
      const page503 = this.makePageEConnError(3, "become available");
      const page504 = this.makePageEConnError(3, "become responsive");
      instance.app.use("/", proxy("http://localhost:3000", {
        // @ts-ignore
        proxyErrorHandler: (err, res, next) => {
          switch (err && err.code) {
            case "ECONNREFUSED": {
              return res.status(503).send(page503);
            }
            case "ECONNRESET": {
              if (err.message === "socket hang up") {
                return res.status(504).send(page504);
              }
            }
            default: {
              next(err);
            }
          }
        },
        timeout: 1000,
      }));
    }

    return instance;
  }

  private registerCallDescription(instance: expressWs.Instance, callDescription: CallDescription) {
    if (callDescription.method === "ws") {
      instance.app.ws(callDescription.endpoint, this.applyWSFunction.bind(this, callDescription.cb));
    } else {
      instance.app[callDescription.method].apply(instance.app, [callDescription.endpoint, this.applyHTTPFunction.bind(this, callDescription.cb)]);
    }
  }

  private applyHTTPFunction(cb: (req: Request, res: Response) => void, req: Request, res: Response) {
    this.embark.events.request("authenticator:authorize", req, res, (err: Error) => {
      if (err) {
        return res.send(err);
      }
      cb(req, res);
    });
  }

  private applyWSFunction(cb: (ws: ws, req: Request) => void, websocket: ws, req: Request) {
    this.embark.events.request("authenticator:authorize", websocket, req, (err: Error) => {
      if (!err) {
        cb(websocket, req);
      }
    });
  }
}
