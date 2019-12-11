import {Embark} from "embark-core";
import { __ } from "embark-i18n";
import {checkIsAvailable, dockerHostSwap, findNextPort} from "embark-utils";

import Server from "./server";

const DEFAULT_PORT = 55555;
const DEFAULT_HOSTNAME = "localhost";

export default class Api {
  private port!: number;
  private api!: Server;
  private apiUrl!: string;
  private isServiceRegistered = false;

  constructor(private embark: Embark, private options: any) {
    this.embark.events.emit("status", __("Starting API & Cockpit UI"));
    findNextPort(DEFAULT_PORT).then((port: any) => {
      this.port = port;
      this.apiUrl = `http://${DEFAULT_HOSTNAME}:${this.port}`;

      this.api = new Server(this.embark, this.port, dockerHostSwap(DEFAULT_HOSTNAME), options.plugins);

      this.listenToCommands();
      this.registerConsoleCommands();
      this.init();
    });
  }

  private init() {
    this.embark.events.request("processes:register", "api", {
      launchFn: (cb: (error: Error | null, message: string) => void) => {
        this.api.start()
          .then(() => cb(null, __("Cockpit UI available at %s", this.apiUrl)))
          .catch((error: Error) => cb(error, ""));
      },
      stopFn: (cb: (error: Error | null, message: string) => void) => {
        this.api.stop()
          .then(() => cb(null, __("Cockpit UI stopped")))
          .catch((error: Error) => cb(error, ""));
      },
    });

    this.embark.events.request("processes:launch", "api", (error: Error | null, message: string) => {
      if (error) {
        this.embark.logger.error(error.message);
      } else {
        this.embark.logger.info(message);
      }
      this.setServiceCheck();
    });

    this.embark.events.on("check:wentOffline:api", () => {
      this.embark.logger.info(__("Cockpit is offline, please close Cockpit."));
    });
    this.embark.events.on("check:backOnline:api", () => {
      this.embark.logger.info(__("Cockpit is online, please open/refresh Cockpit."));
    });
  }

  private setServiceCheck() {
    if (this.isServiceRegistered) {
      return;
    }
    this.isServiceRegistered = true;
    this.embark.events.request("services:register", "api", (cb: (options: object) => any) => {
      checkIsAvailable(this.apiUrl, (isAvailable: boolean) => {
        const devServer = __("Cockpit UI") + " (" + this.apiUrl + ")";
        const serverStatus = (isAvailable ? "on" : "off");
        return cb({ name: devServer, status: serverStatus });
      });
    });
  }

  private listenToCommands() {
    this.embark.events.setCommandHandler("api:url", (cb) => cb(this.apiUrl));
    this.embark.events.setCommandHandler("api:start", (cb) => {
      this.embark.logger.warn(__("The event 'api:start' has been deprecated and will be removed in future versions."));
      this.embark.events.request("processes:launch", "api", cb);
    });
    this.embark.events.setCommandHandler("api:stop", (cb) => {
      this.embark.logger.warn(__("The event 'api:stop' has been deprecated and will be removed in future versions."));
      this.embark.events.request("processes:stop", "api", cb);
    });
    this.embark.events.setCommandHandler("logs:api:enable", (cb) => {
      this.api.enableLogging();
      cb();
    });
    this.embark.events.setCommandHandler("logs:api:disable", (cb) => {
      this.api.disableLogging();
      cb();
    });
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __("Start or stop the API"),
      matches: ["api start"],
      process: (cmd: string, callback: (msg: string) => void) => {
        const message = __("The command 'api:start' has been deprecated in favor of 'service api on' and will be removed in future versions.");
        this.embark.logger.warn(message); // logs to Embark's console
        this.embark.events.request("processes:launch", "api", (err: string, msg: string) => {
          callback(err || msg); // logs to Cockpit's console
        });
      },
      usage: "api start/stop",
    });

    this.embark.registerConsoleCommand({
      matches: ["api stop"],
      process: (cmd: string, callback: (msg: string) => void) => {
        const message = __("The command 'api:stop' has been deprecated in favor of 'service api off' and will be removed in future versions.");
        this.embark.logger.warn(message); // logs to Embark's console
        this.embark.events.request("processes:stop", "api", (err: string, msg: string) => {
          callback(err || msg); // logs to Cockpit's console
        });
      },
    });

    this.embark.registerConsoleCommand({
      matches: ["log api on"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("logs:api:enable", callback);
      },
    });

    this.embark.registerConsoleCommand({
      matches: ["log api off"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("logs:api:disable", callback);
      },
    });
  }
}
