import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {IPC} from "embark-core";
import {AccountParser, dappPath} from "embark-utils";
import {Proxy} from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private proxyIpc: IPC;
  private rpcProxy: any;
  private wsProxy: any;
  private readonly host: string;
  private readonly rpcPort: number;
  private readonly wsPort: number;
  private ready: boolean;

  constructor(private embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.proxyIpc = new IPC({ipcRole: "client"});
    this.ready = false;

    this.host = "localhost";
    this.rpcPort = this.embark.config.blockchainConfig.rpcPort + constants.blockchain.servicePortOnProxy;
    this.wsPort = this.embark.config.blockchainConfig.wsPort + constants.blockchain.servicePortOnProxy;

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
      // TODO actually check for the wanted connection
      cb(null, `http://${this.host}:${this.rpcPort}`);
      // cb(null, `ws://${this.host}:${this.wsPort}`);
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
