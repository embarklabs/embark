import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {AccountParser, dappPath} from "embark-utils";
const Web3 = require("web3");
const ethUtil = require("ethereumjs-util");

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private accounts: any[];
  private web3: any;

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

    this.embark.registerActionForEvent("blockchain:proxy:request", this.checkBlockchainRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.checkBlockchainResponse.bind(this));
  }

  private async checkBlockchainRequest(params: any, callback: (error: any, result: any) => void) {
    if (!this.accounts.length) {
      return callback(null, params);
    }
    if (params.reqData.method === "eth_sendTransaction") {
      // Check if we have that account in our wallet
      const account = this.accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(params.reqData.params[0].from));
      if (account) {
        return this.web3.eth.accounts.signTransaction(params.reqData.params[0], account.privateKey , (err: any, result: any) => {
          if (err) {
            return callback(err, null);
          }
          params.reqData.method = "eth_sendRawTransaction";
          params.reqData.params = [result.rawTransaction] ;
          callback(err, params);
        });
      }
    }
    callback(null, params);
  }

  private async checkBlockchainResponse(params: any, callback: (error: any, result: any) => void) {
    if (!this.accounts.length) {
      return callback(null, params);
    }
    if (params.reqData.method === "eth_accounts") {
      params.respData.result = this.accounts.map((acc) => acc.address);
      return callback(null, params);
    }
    callback(null, params);
  }

  private async parseAccounts() {
    if (!this.web3) {
      const provider = await this.events.request2("blockchain:client:provider", "ethereum");
      this.web3 = new Web3(provider);
    }
    // TODO add fund account
    const nodeAccounts = await this.web3.eth.getAccounts();
    this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, this.web3, dappPath(), this.logger, nodeAccounts);
  }
}
