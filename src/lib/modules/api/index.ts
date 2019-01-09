import {Embark} from "../../../typings/embark";
import {dockerHostSwap} from "../../utils/host.js";
import {findNextPort} from "../../utils/network";
import Server from "./server";

const utils = require("../../utils/utils.js");

const DEFAULT_PORT = 55555;
const DEFAULT_HOSTNAME = "localhost";

export default class Api {
  private port!: number;
  private api!: Server;
  private apiUrl!: string;

  constructor(private embark: Embark, private options: any) {
    this.embark.events.emit("status", __("Starting API"));
    findNextPort(DEFAULT_PORT).then((port) => {
      this.port = port;
      this.apiUrl = `http://${DEFAULT_HOSTNAME}:${this.port}`;

      this.api = new Server(this.embark, this.port, dockerHostSwap(DEFAULT_HOSTNAME), options.plugins);

      this.listenToCommands();
      this.registerConsoleCommands();

      this.embark.events.request("processes:register", "api", {
        launchFn: (cb: (error: Error | null, message: string) => void) => {
          this.api.start()
            .then(() => cb(null, __("API available at %s", this.apiUrl)))
            .catch((error: Error) => cb(error, ""));
        },
        stopFn: (cb: (error: Error | null, message: string) => void) => {
          this.api.stop()
            .then(() => cb(null, __("API stopped")))
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
      utils.checkIsAvailable(this.apiUrl, (isAvailable: boolean) => {
        const devServer = __("API") + " (" + this.apiUrl + ")";
        const serverStatus = (isAvailable ? "on" : "off");
        return cb({name: devServer, status: serverStatus});
      });
    });

    this.embark.events.on("check:wentOffline:api", () => {
      this.embark.logger.info(__("API is offline"));
    });
  }

  private listenToCommands() {
    this.embark.events.setCommandHandler("api:url", (cb) => cb(this.apiUrl));
    this.embark.events.setCommandHandler("start-api", (cb) => this.embark.events.request("processes:launch", "api", cb));
    this.embark.events.setCommandHandler("stop-api",  (cb) => this.embark.events.request("processes:stop", "api", cb));
    this.embark.events.setCommandHandler("logs:api:turnOn",  (cb) => {
      this.api.enableLogging();
      cb();
    });
    this.embark.events.setCommandHandler("logs:api:turnOff",  (cb) => {
      this.api.disableLogging();
      cb();
    });
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __("Start or stop the API"),
      matches: ["api start"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("start-api", callback);
      },
      usage: "api start/stop",
    });

    this.embark.registerConsoleCommand({
      matches: ["api stop"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("stop-api", callback);
      },
    });

    this.embark.registerConsoleCommand({
      matches: ["log api on"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("logs:api:turnOn", callback);
      },
    });

    this.embark.registerConsoleCommand({
      matches: ["log api off"],
      process: (cmd: string, callback: () => void) => {
        this.embark.events.request("logs:api:turnOff", callback);
      },
    });
  }
}
