import {Embark} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import { __ } from "embark-i18n";
import {checkIsAvailable, dockerHostSwap, findNextPort} from "embark-utils";

import Server from "./server";

const DEFAULT_PORT = 55555;
const DEFAULT_HOSTNAME = "localhost";

export default class Api {
  private port!: number;
  private api!: Server;
  private apiUrl!: string;

  constructor(private embark: Embark, private options: any) {
    this.embark.events.emit("status", __("Starting API & Cockpit UI"));
    findNextPort(DEFAULT_PORT).then((port: any) => {
      this.port = port;
      this.apiUrl = `http://${DEFAULT_HOSTNAME}:${this.port}`;

      this.api = new Server(this.embark, this.port, dockerHostSwap(DEFAULT_HOSTNAME), options.plugins);

      this.listenToCommands();
      this.registerConsoleCommands();

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
    });
  }

  private setServiceCheck() {
    this.embark.events.request("services:register", "api", (cb: (options: object) => any) => {
      checkIsAvailable(this.apiUrl, (isAvailable: boolean) => {
        const devServer = __("Cockpit UI") + " (" + this.apiUrl + ")";
        const serverStatus = (isAvailable ? "on" : "off");
        return cb({name: devServer, status: serverStatus});
      });
    });

    this.embark.events.on("check:wentOffline:api", () => {
      this.embark.logger.info(__("Cockpit UI is offline"));
    });
  }

  private listenToCommands() {
    this.embark.events.setCommandHandler("api:url", (cb) => cb(this.apiUrl));
    this.embark.events.setCommandHandler("api:start", (cb) => this.embark.events.request("processes:launch", "api", cb));
    this.embark.events.setCommandHandler("api:stop",  (cb) => this.embark.events.request("processes:stop", "api", cb));
    this.embark.events.setCommandHandler("logs:api:enable",  (cb) => {
      this.api.enableLogging();
      cb();
    });
    this.embark.events.setCommandHandler("logs:api:disable",  (cb) => {
      this.api.disableLogging();
      cb();
    });
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __("Start or stop the API"),
      matches: ["api start"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("api:start", callback);
      },
      usage: "api start/stop",
    });

    this.embark.registerConsoleCommand({
      matches: ["api stop"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("api:stop", callback);
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
