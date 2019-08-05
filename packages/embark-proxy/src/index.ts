import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {IPC} from "embark-core";
import {AccountParser, dappPath} from "embark-utils";
import {Proxy} from "./proxy";

const constants = require("embark-core/constants");

export default class ProxyManager {
  private logger: Logger;
  private events: Events;
  private proxyIpc: IPC;
  private rpcProxy: any;
  private wsProxy: any;
  // private rpcPort: number;
  // private wsPort: number;

  constructor(private embark: Embark, _options: any) {
    console.log("ALLO");
    this.logger = embark.logger;
    this.events = embark.events;
    this.proxyIpc = new IPC({ipcRole: "client"});

    this.embark.config.blockchainConfig.rpcPort += constants.blockchain.servicePortOnProxy;
    this.embark.config.blockchainConfig.wsPort += constants.blockchain.servicePortOnProxy;

    this.events.once("blockchain:ready", () => {
      console.log("SETUP");
      this.setupProxy();
    });
  }

  private async setupProxy() {
    if (this.embark.config.blockchainConfig.proxy) {
      return;
    }
    const addresses = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, false, dappPath(), this.logger);

    let wsProxy;
    if (this.embark.config.blockchainConfig.wsRPC) {
      wsProxy = new Proxy(this.proxyIpc).serve(
        this.embark.config.blockchainConfig.wsHost,
        this.embark.config.blockchainConfig.wsPort,
        true, this.embark.config.blockchainConfig.wsOrigins,
        addresses,
        this.embark.config.webServerConfig.certOptions);
    }

    [this.rpcProxy, this.wsProxy] = await Promise.all([
      new Proxy(this.proxyIpc).serve(
        this.embark.config.blockchainConfig.rpcHost,
        this.embark.config.blockchainConfig.rpcPort,
        false,
        null,
        addresses,
        this.embark.config.webServerConfig.certOptions),
      wsProxy,
    ]);
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
