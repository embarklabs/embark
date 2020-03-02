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
      this._web3 = null;

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
    const accounts = await this.accounts;
    if (!accounts.length || !this.embark.config.blockchainConfig.isDev) {
      return;
    }
    try {
      const web3 = await this.web3;
      const coinbase = await this.getCoinbaseAddress();
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

  async findAccountWithMostFunds() {
    const web3 = await this.web3;
    const accounts = await web3.eth.getAccounts();
    let highestBalance = {
      balance: web3.utils.toBN(0),
      account: ""
    };
    for (const account of accounts) {
      // eslint-disable-next-line no-await-in-loop
      const balance = web3.utils.toBN(await web3.eth.getBalance(account));
      if (balance.gt(highestBalance.balance)) {
        highestBalance = { balance, account };
      }
    }
    return highestBalance.account;
  }

  async findAlternativeCoinbase() {
    try {
      return this.findAccountWithMostFunds();
    } catch (err) {
      throw new Error(`Error getting coinbase address: ${err.message || err}`);
    }
  }

  async getCoinbaseAddress() {
    const web3 = await this.web3;
    try {
      const coinbaseAddress = await web3.eth.getCoinbase();
      // if the blockchain returns a zeroed address, we can find the account
      // with the most funds and use that as the "from" account to txfer
      // funds.
      if (!coinbaseAddress ||
        web3.utils.hexToNumberString(coinbaseAddress) === "0" || // matches 0x0 and 0x00000000000000000000000000000000000000
        (await web3.eth.getBalance(coinbaseAddress)) === "0"
      ) {
        return this.findAlternativeCoinbase();
      }
      return coinbaseAddress;
    } catch (err) {
      // if the blockchain doesn't support 'eth_coinbase' RPC commands,
      // we can find the account with the most funds and use that as the
      // "from" account to txfer funds.
      if (err.message.includes("The method eth_coinbase does not exist/is not available")) {
        return this.findAlternativeCoinbase();
      }
      throw new Error(`Error finding coinbase address: ${err.message || err}`);
    }
  }
}
