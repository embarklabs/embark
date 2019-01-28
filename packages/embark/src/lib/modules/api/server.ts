import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import proxy from "express-http-proxy";
import expressWs from "express-ws";
import findUp from "find-up";
import helmet from "helmet";
import * as http from "http";
import * as path from "path";
import * as ws from "ws";
import { Embark, Plugins } from "../../../typings/embark";
// @ts-ignore
import { embarkPath } from "../../core/fs";

type Method = "get" | "post" | "ws" | "delete";

interface CallDescription {
  method: Method;
  endpoint: string;
  cb(req: Request | ws, res: Response | Request): void;
}

export default class Server {
  private isLogging: boolean = false;
  private expressInstance: expressWs.Instance;
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

  private initApp() {
    const instance = expressWs(express());
    instance.app.use((req: Request, res: Response, next: NextFunction) => {
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
      instance.app.get("/embark-api/plugins", (req: Request, res: Response) => {
        res.send(JSON.stringify(this.plugins.plugins.map((plugin) => ({name: plugin.name}))));
      });

      const callDescriptions: CallDescription[] = this.plugins.getPluginsProperty("apiCalls", "apiCalls");
      callDescriptions.forEach((callDescription) => this.registerCallDescription(instance, callDescription));
    }

    this.embark.events.on("plugins:register:api", (callDescription: CallDescription) => this.registerCallDescription(instance, callDescription));

    let ui: express.RequestHandler;
    if (process.env.EMBARK_DEVELOPMENT) {
      ui = proxy("http://localhost:3000");
    } else {
      ui = express.static(
        findUp.sync("node_modules/embark-ui/build", {cwd: embarkPath()}) ||
          embarkPath("node_modules/embark-ui/build"),
      );
    }

    instance.app.use("/", ui);
    instance.app.use("/*", ui);

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
