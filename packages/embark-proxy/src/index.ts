import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {IPC} from "embark-core";
import {AccountParser, dappPath, findNextPort} from "embark-utils";
import {Proxy} from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private proxyIpc: IPC;
  private rpcProxy: any;
  private wsProxy: any;
  private readonly host: string;
  private rpcPort: number | undefined;
  private wsPort: number | undefined;
  private ready: boolean;

  constructor(private embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.proxyIpc = new IPC({ipcRole: "client"});
    this.ready = false;

    this.host = "localhost";

    this.events.once("blockchain:started", async () => {
      await this.setupProxy();
      this.ready = true;
      this.events.emit("proxy:ready");
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

    [this.rpcProxy, this.wsProxy] = await Promise.all([
      new Proxy(this.proxyIpc).serve(
        this.embark.config.blockchainConfig.rpcHost,
        this.embark.config.blockchainConfig.rpcPort,
        this.host,
        this.rpcPort,
        false,
        null,
        addresses,
        this.embark.config.webServerConfig.certOptions,
      ),
      this.embark.config.blockchainConfig.wsRPC ? new Proxy(this.proxyIpc).serve(
        this.embark.config.blockchainConfig.wsHost,
        this.embark.config.blockchainConfig.wsPort,
        this.host,
        this.wsPort,
        true,
        this.embark.config.blockchainConfig.wsOrigins,
        addresses,
        this.embark.config.webServerConfig.certOptions) : null,
    ]);
    return;
  }

  public shutdownProxy() {
    if (!this.embark.config.blockchainConfig.proxy) {
      return;
    }

    if (this.rpcProxy) {
      this.rpcProxy.close();
    }
    if (this.wsProxy) {
      this.wsProxy.close();
    }
  }
}
