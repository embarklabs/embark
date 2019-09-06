import async from "async";
import { Embark, Events, Logger } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import { __ } from "embark-i18n";
import { AccountParser, dappPath } from "embark-utils";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");

import fundAccount from "./fundAccount";

function arrayEqual(arrayA: string[], arrayB: string[]) {
  if (arrayA.length !== arrayB.length) {
    return false;
  } else {
    return arrayA.every((address, index) => Web3.utils.toChecksumAddress(address) === Web3.utils.toChecksumAddress(arrayB[index]));
  }
}

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private accounts: any[] = [];
  private nodeAccounts: string[] = [];
  private _web3: Web3 | null = null;
  private ready = false;
  private signTransactionQueue: any;
  private nonceCache: any = {};

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;

    this.parseAndFundAccounts();

    this.embark.registerActionForEvent("blockchain:proxy:request", this.checkBlockchainRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.checkBlockchainResponse.bind(this));

    // Allow to run transaction in parallel by resolving the nonce manually.
    // For each transaction, resolve the nonce by taking the max of current transaction count and the cache we keep locally.
    // Update the nonce and sign it
    this.signTransactionQueue = async.queue(({ payload, account }, callback: (error: any, result: any) => void) => {
      this.getNonce(payload.from, async (err: any, newNonce: number) => {
        if (err) {
          return callback(err, null);
        }
        payload.nonce = newNonce;
        const web3 = await this.web3;
        web3.eth.accounts.signTransaction(payload, account.privateKey, (signingError: any, result: any) => {
          if (signingError) {
            return callback(signingError, null);
          }
          callback(null, result.rawTransaction);
        });
      });
    }, 1);
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

  private async getNonce(address: string, callback: (error: any, result: any) => void) {
    const web3 = await this.web3;
    web3.eth.getTransactionCount(address, undefined, (error: any, transactionCount: number) => {
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
    if (!this.ready) {
      return callback(null, params);
    }
    if (params.reqData.method === blockchainConstants.transactionMethods.eth_sendTransaction && this.accounts.length) {
      // Check if we have that account in our wallet
      const account = this.accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(params.reqData.params[0].from));
      if (account && account.privateKey) {
        return this.signTransactionQueue.push({ payload: params.reqData.params[0], account }, (err: any, newPayload: any) => {
          if (err) {
            return callback(err, null);
          }
          params.reqData.method = blockchainConstants.transactionMethods.eth_sendRawTransaction;
          params.reqData.params = [newPayload];
          callback(err, params);
        });
      }
    }
    callback(null, params);
  }

  private async checkBlockchainResponse(params: any, callback: (error: any, result: any) => void) {
    if (!this.ready) {
      return callback(null, params);
    }
    if ((params.reqData.method === blockchainConstants.transactionMethods.eth_accounts ||
      params.reqData.method === blockchainConstants.transactionMethods.personal_listAccounts) && this.accounts.length) {
      if (!arrayEqual(params.respData.result, this.nodeAccounts)) {
        this.nodeAccounts = params.respData.result;
        const web3 = await this.web3;
        this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, this.nodeAccounts);
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

  private async parseAndFundAccounts() {
    const web3 = await this.web3;

    const nodeAccounts = await web3.eth.getAccounts();
    this.nodeAccounts = nodeAccounts;
    this.accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, nodeAccounts);

    if (!this.accounts.length || !this.embark.config.blockchainConfig.isDev) {
      this.ready = true;
      return;
    }
    try {
      const coinbase = await web3.eth.getCoinbase();
      const fundingAccounts = this.accounts
        .filter((account) => account.address)
        .map((account) => {
          return fundAccount(web3, account.address, coinbase, account.hexBalance);
      });
      await Promise.all([fundingAccounts]);
    } catch (err) {
      this.logger.error(__("Error funding accounts"), err.message || err);
    }
    this.ready = true;
  }
}
