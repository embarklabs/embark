import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {AccountParser, dappPath} from "embark-utils";
const Web3 = require("web3");

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private accounts: any[];

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.accounts = [];

    this.events.request("proxy:onReady", () => {
      this.parseAccounts();
    });

    this.events.setCommandHandler("accounts:get", (cb: any) => {
      cb(null, this.accounts);
    });

    this.embark.registerActionForEvent("blockchain:proxy:response", this.checkBlockchainResponse.bind(this));
  }

  private async checkBlockchainResponse(params: any, callback: (error: any, result: any) => void) {
    // TODO add TX support for wallet
    if (params.reqData.method === "eth_accounts" && this.accounts.length) {
      params.respData.data = this.accounts.map((acc) => acc.address);
      return callback(null, params);
    }
    callback(null, params);
  }

  private async parseAccounts() {
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    const nodeAccounts = await web3.eth.getAccounts();
    this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, nodeAccounts);
  }
}
