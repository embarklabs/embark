import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {__} from "embark-i18n";
import {buildUrl, findNextPort} from "embark-utils";
import {Proxy} from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private proxy: any;
  private plugins: any;
  private readonly host: string;
  private rpcPort: number;
  private wsPort: number;
  private ready: boolean;
  private isWs = false;

  constructor(private embark: Embark, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.ready = false;
    this.rpcPort = 0;
    this.wsPort = 0;

    this.host = "localhost";

    this.events.once("blockchain:started", async () => {
      await this.setupProxy();
      this.ready = true;
      this.events.emit("proxy:ready");
    });

    if (!this.embark.config.blockchainConfig.proxy) {
      this.logger.warn(__("The proxy has been disabled -- some Embark features will not work."));
      this.logger.warn(__("Configured wallet accounts will be ignored and cannot be used in the DApp, and transactions will not be logged."));
    }

    this.events.setCommandHandler("proxy:endpoint:get", async (cb) => {
      await this.onReady();
      if (!this.embark.config.blockchainConfig.proxy) {
        return cb(null, this.embark.config.blockchainConfig.endpoint);
      }
      // TODO Check if the proxy can support HTTPS, though it probably doesn't matter since it's local
      if (this.isWs) {
        return cb(null, buildUrl("ws", this.host, this.wsPort, "ws"));
      }
      cb(null, buildUrl("http", this.host, this.rpcPort, "rpc"));
    });
  }

  public onReady() {
    return new Promise((resolve, _reject) => {
      if (this.ready) {
        return resolve();
      }
      this.events.once("proxy:ready", () => {
        resolve();
      });
    });
  }

  private async setupProxy() {
    if (!this.embark.config.blockchainConfig.proxy) {
      return;
    }
    const port = await findNextPort(this.embark.config.blockchainConfig.rpcPort + constants.blockchain.servicePortOnProxy);

    this.rpcPort = port;
    this.wsPort = port + 1;
    this.isWs = (/wss?/).test(this.embark.config.blockchainConfig.endpoint);

    this.proxy = await new Proxy({events: this.events, plugins: this.plugins, logger: this.logger})
      .serve(
        this.embark.config.blockchainConfig.endpoint,
        this.host,
        this.isWs ? this.wsPort : this.rpcPort,
        this.isWs,
      );
    return;
  }
}
