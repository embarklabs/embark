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
  private nodeAccounts: string[];
  private web3: any;
  private ready: boolean;
  private signTransactionQueue: any;
  private nonceCache: any;

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.accounts = [];
    this.nodeAccounts = [];
    this.nonceCache = {};
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

    // Allow to run transaction in parallel by resolving the nonce manually.
    // For each transaction, resolve the nonce by taking the max of current transaction count and the cache we keep locally.
    // Update the nonce and sign it
    this.signTransactionQueue = async.queue(({payload, account}, callback: (error: any, result: any) => void) => {
      this.getNonce(payload.from, (err: any, newNonce: number) => {
        if (err) {
          return callback(err, null);
        }
        payload.nonce = newNonce;
        this.web3.eth.accounts.signTransaction(payload, account.privateKey , (signingError: any, result: any) => {
          if (signingError) {
            return callback(signingError, null);
          }
          callback(null, result.rawTransaction);
        });
      });
    }, 1);
  }

  private getNonce(address: string, callback: (error: any, result: any) => void) {
    this.web3.eth.getTransactionCount(address, undefined, (error: any, transactionCount: number) => {
      if (error) {
        return callback(error, null);
      }
      if (this.nonceCache[address] === undefined) {
        this.nonceCache[address] = -1;
      }

      if (transactionCount > this.nonceCache[address]) {
        this.nonceCache[address] = transactionCount;
        return callback(null, this.nonceCache[address]);
      }

      this.nonceCache[address]++;
      callback(null, this.nonceCache[address]);
    });
  }

  private async checkBlockchainRequest(params: any, callback: (error: any, result: any) => void) {
    if (params.reqData.method === "eth_sendTransaction" && this.accounts.length) {
      // Check if we have that account in our wallet
      const account = this.accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(params.reqData.params[0].from));
      if (account && account.privateKey) {
        return this.signTransactionQueue.push({payload: params.reqData.params[0], account}, (err: any, newPayload: any) => {
          if (err) {
            return callback(err, null);
          }
          params.reqData.method = "eth_sendRawTransaction";
          params.reqData.params = [newPayload];
          callback(err, params);
        });
      }
    }
    callback(null, params);
  }

  public arrayEqual(arrayA: string[], arrayB: string[]) {
    if (arrayA.length !== arrayB.length) {
      return false;
    } else {
      return arrayA.every((address, index) => Web3.utils.toChecksumAddress(address) === Web3.utils.toChecksumAddress(arrayB[index]));
    }
  }

  private async checkBlockchainResponse(params: any, callback: (error: any, result: any) => void) {
    if ((params.reqData.method === "eth_accounts" || params.reqData.method === "personal_listAccounts") && this.accounts.length) {
      if (!this.arrayEqual(params.respData.result, this.nodeAccounts)) {
        this.nodeAccounts = params.respData.result;
        this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, this.web3, dappPath(), this.logger, this.nodeAccounts);
      }
      params.respData.result = this.accounts.map((acc) => {
        if (acc.address) {
          return acc.address;
        }
        return acc;
      });
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
    this.nodeAccounts = nodeAccounts;
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
