import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {IPC} from "embark-core";
import {__} from "embark-i18n";
import {AccountParser, dappPath, findNextPort} from "embark-utils";
import {Proxy} from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private proxyIpc: IPC;
  private proxy: any;
  private plugins: any;
  private readonly host: string;
  private rpcPort: number | undefined;
  private wsPort: number | undefined;
  private ready: boolean;

  constructor(private embark: Embark, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.proxyIpc = new IPC({ipcRole: "client"});
    this.ready = false;

    this.host = "localhost";

    this.events.once("blockchain:started", async () => {
      await this.setupProxy();
      this.ready = true;
      this.events.emit("proxy:ready");
    });

    if (!this.embark.config.blockchainConfig.proxy) {
      this.logger.warn(__("The proxy has been disabled. This means that some Embark features will not work, like the wallet for your custom accounts or the transaction logger"));
    }

    this.events.setCommandHandler("proxy:onReady", async (cb) => {
      await this.onReady();
      cb();
    });

    this.events.setCommandHandler("blockchain:client:endpoint", async (cb) => {
      await this.onReady();
      if (!this.embark.config.blockchainConfig.proxy) {
        return cb(null, this.embark.config.blockchainConfig.endpoint);
      }
      // TODO Check if the proxy can support HTTPS, though it probably doesn't matter since it's local
      if (this.embark.config.blockchainConfig.wsRPC) {
        return cb(null, `ws://${this.host}:${this.wsPort}`);
      }
      cb(null, `http://${this.host}:${this.rpcPort}`);
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

    const addresses = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, false, dappPath(), this.logger);

    this.proxy = await new Proxy({ipc: this.proxyIpc, events: this.events, plugins: this.plugins, logger: this.logger})
      .serve(
        this.embark.config.blockchainConfig.endpoint,
        this.host,
        this.embark.config.blockchainConfig.wsRPC ? this.wsPort : this.rpcPort,
        this.embark.config.blockchainConfig.wsRPC,
        null,
      );
    return;
  }

  public shutdownProxy() {
    if (!this.embark.config.blockchainConfig.proxy) {
      return;
    }

    if (this.proxy) {
      this.proxy.close();
    }
  }
}
