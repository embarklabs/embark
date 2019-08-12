import async from "async";
import {Embark, Events, Logger} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import {__} from "embark-i18n";
import {AccountParser, dappPath} from "embark-utils";
import Web3 from "web3";

import fundAccount from "./fundAccount";

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private accounts: any[];
  private web3: any;
  private ready: boolean;

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.accounts = [];
    this.ready = false;

    this.events.setCommandHandler("accounts-manager:onReady", (cb) => {
      if (this.ready) {
        return cb();
      }
      this.events.once("accounts-manager:ready", cb);
    });
    this.events.request("proxy:onReady", () => {
      this.parseAccounts();
    });

    this.events.setCommandHandler("accounts:get", (cb: any) => {
      cb(null, this.accounts);
    });
  }

  private async checkBlockchainRequest(params: any, callback: (error: any, result: any) => void) {
    if (params.reqData.method === "eth_sendTransaction" && this.accounts.length) {
      // Check if we have that account in our wallet
      const account = this.accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(params.reqData.params[0].from));
      if (account) {
        return this.web3.eth.accounts.signTransaction(params.reqData.params[0], account.privateKey , (err: any, result: any) => {
          if (err) {
            return callback(err, null);
          }
          params.reqData.method = "eth_sendRawTransaction";
          params.reqData.params = [result.rawTransaction];
          callback(err, params);
        });
      }
    }
    callback(null, params);
  }

  private async checkBlockchainResponse(params: any, callback: (error: any, result: any) => void) {
    if (params.reqData.method === "eth_accounts" && this.accounts.length) {
      params.respData.result = this.accounts.map((acc) => acc.address);
      return callback(null, params);
    }
    callback(null, params);
  }

  private setReady() {
    if (this.ready) {
      return;
    }
    this.embark.registerActionForEvent("blockchain:proxy:request", this.checkBlockchainRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.checkBlockchainResponse.bind(this));
    this.ready = true;
    this.events.emit("accounts-manager:ready");
  }

  private async parseAccounts() {
    if (!this.web3) {
      const provider = await this.events.request2("blockchain:client:provider", "ethereum");
      this.web3 = new Web3(provider);
    }

    const nodeAccounts = await this.web3.eth.getAccounts();
    this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, this.web3, dappPath(), this.logger, nodeAccounts);

    if (!this.accounts.length || !this.embark.config.blockchainConfig.isDev) {
      return this.setReady();
    }
    async.eachLimit(this.accounts, 1, (account, eachCb) => {
      if (!account.address) {
        return eachCb();
      }
      fundAccount(this.web3, account.address, account.hexBalance, eachCb);
    }, (err) => {
      if (err) {
        this.logger.error(__("Error funding accounts"), err.message || err);
      }
      this.setReady();
    });
  }
}
