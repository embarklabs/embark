import {Embark, Events } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {__} from "embark-i18n";
import { buildUrl, findNextPort } from "embark-utils";
import { Logger } from 'embark-logger';
import { Proxy } from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private proxy: any;
  private plugins: any;
  private readonly host: string;
  private rpcPort = 0;
  private wsPort = 0;
  private ready = false;
  private isWs = false;
  private vms: any[];

  constructor(private embark: Embark, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.vms = [];

    this.host = "localhost";

    this.events.on("blockchain:started", async (clientName: string) => {
      try {
        await this.setupProxy(clientName);

        this.ready = true;
        this.events.emit("proxy:ready");
      } catch (error) {
        this.logger.error(`Error during proxy setup: ${error.message}. Use '--loglevel debug' for more detailed information.`);
        this.logger.debug(`Error during proxy setup:\n${error.stack}`);
      }
    });
    this.events.on("blockchain:stopped", async (clientName: string, node?: string) => {
      this.ready = false;
      await this.stopProxy();
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

    this.events.setCommandHandler("proxy:vm:register", (handler: any) => {
      this.vms.push(handler);
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

  private async setupProxy(clientName: string) {
    if (!this.embark.config.blockchainConfig.proxy) {
      return;
    }
    if (this.proxy) {
      throw new Error("Proxy is already started");
    }
    const port = await findNextPort(this.embark.config.blockchainConfig.rpcPort + constants.blockchain.servicePortOnProxy);

    this.rpcPort = port;
    this.wsPort = port + 1;
    this.isWs = clientName === constants.blockchain.vm || (/wss?/).test(this.embark.config.blockchainConfig.endpoint);

    this.proxy = await new Proxy({
      endpoint: clientName === constants.blockchain.vm ? constants.blockchain.vm : this.embark.config.blockchainConfig.endpoint,
      events: this.events,
      isWs: this.isWs,
      logger: this.logger,
      plugins: this.plugins,
      vms: this.vms,
    });

    await this.proxy.serve(
      this.host,
      this.isWs ? this.wsPort : this.rpcPort,
    );
  }

  private stopProxy() {
    this.proxy.stop();
    this.proxy = null;
  }
}
