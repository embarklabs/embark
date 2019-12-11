import async from "async";
import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import { Logger } from "embark-logger";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcModifier from "./rpcModifier";

export default class EthSendTransaction extends RpcModifier {
  private signTransactionQueue: any;
  private nonceCache: any = {};
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents) {
    super(embark, rpcModifierEvents);

    embark.registerActionForEvent("blockchain:proxy:request", this.ethSendTransactionRequest.bind(this));

    // Allow to run transaction in parallel by resolving the nonce manually.
    // For each transaction, resolve the nonce by taking the max of current transaction count and the cache we keep locally.
    // Update the nonce and sign it
    this.signTransactionQueue = async.queue(({ payload, account }, callback: Callback<any>) => {
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

  private async getNonce(address: string, callback: Callback<any>) {
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
  private async ethSendTransactionRequest(params: any, callback: Callback<any>) {
    if (!(params.request.method === blockchainConstants.transactionMethods.eth_sendTransaction)) {
      return callback(null, params);
    }
    const accounts = await this.accounts;
    if (!(accounts && accounts.length)) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.request.method}' request:`));
    this.logger.trace(__(`Original request data: ${JSON.stringify({ request: params.request, response: params.response })}`));

    try {
      // Check if we have that account in our wallet
      const account = accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(params.request.params[0].from));
      if (account && account.privateKey) {
        return this.signTransactionQueue.push({ payload: params.request.params[0], account }, (err: any, newPayload: any) => {
          if (err) {
            return callback(err, null);
          }
          params.request.method = blockchainConstants.transactionMethods.eth_sendRawTransaction;
          params.request.params = [newPayload];
          callback(err, params);
        });
      }
    } catch (err) {
      return callback(err);
    }
    this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
    callback(null, params);
  }
}
