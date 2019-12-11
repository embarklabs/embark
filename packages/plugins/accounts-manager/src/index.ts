import async from "async";
import { Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import { AccountParser, dappPath } from "embark-utils";
import { Logger } from 'embark-logger';
import Web3 from "web3";

import fundAccount from "./fundAccount";

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: EmbarkEvents;
  private _web3: Web3 | null = null;
  private _accounts: any[] | null = null;

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;

    this.parseAndFundAccounts();
    this.events.on("blockchain:started", () => {
      this._web3 = null;
    });

    this.embark.registerActionForEvent("tests:config:updated", async (params, cb) => {
      // reset accounts backing variable as the accounts in config may have changed and
      // web.eth.getAccounts may return a different value now
      this._accounts = null;

      // as the accounts may have changed, we need to fund the accounts again
      await this.parseAndFundAccounts();
      cb(null, null);
    });
  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  get accounts() {
    return (async () => {
      if (!this._accounts) {
        const web3 = await this.web3;
        this._accounts = await web3.eth.getAccounts();
      }
      return this._accounts || [];
    })();
  }

  private async parseAndFundAccounts() {
    const web3 = await this.web3;
    const accounts = await this.accounts;

    if (!accounts.length || !this.embark.config.blockchainConfig.isDev) {
      return;
    }
    try {
      const coinbase = await web3.eth.getCoinbase();
      const acctsFromConfig = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, accounts);
      const accountsWithBalance = accounts.map((address) => {
        const acctFromConfig = acctsFromConfig.find((acctCfg) => acctCfg.address === address);
        return {
          address,
          hexBalance: acctFromConfig ? acctFromConfig.hexBalance : undefined
        };
      });

      async.eachLimit(accountsWithBalance, 1, (acct, eachCb) => {
        fundAccount(web3, acct.address, coinbase, acct.hexBalance)
          .then(() => {
            eachCb();
          })
          .catch(eachCb);
      });
    } catch (err) {
      this.logger.error(__("Error funding accounts"), err.message || err);
    }
  }
}
