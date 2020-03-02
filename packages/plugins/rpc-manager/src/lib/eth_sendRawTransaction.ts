import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcModifier from "./rpcModifier";
import quorumjs from "quorum-js";

const TESSERA_PRIVATE_URL_DEFAULT = "http://localhost:9081";

declare module "embark-core" {
  interface ClientConfig {
    tesseraPrivateUrl?: string;
  }
  interface ContractConfig {
    privateFor?: string[];
    privateFrom?: string;
  }
}

// TODO: Because this is quorum-specific, move this entire file to the embark-quorum plugin where it
// should be registered in the RPC modifier (which doesn't yet exist). RPC modifier registration should be created as follows:
// TODO: 1. move embark-rpc-manager to proxy so it can be a stack component
// TODO: 2. Create command handler that allows registration of an RPC modifier (rpcMethodName: string | Regex, action)
// TODO: 3. add only 1 instance of registerActionForEvent('blockchain:proxy:request/response')
// TODO: 4. For each request/response, loop through registered RPC modifiers finding matches against RPC method name
// TODO: 5. run matched action for request/response
// TODO: This should be done after https://github.com/embarklabs/embark/pull/2150 is merged.
export default class EthSendRawTransaction extends RpcModifier {
  private _rawTransactionManager: any;
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    embark.registerActionForEvent("blockchain:proxy:request", this.ethSendRawTransactionRequest.bind(this));
    embark.registerActionForEvent("blockchain:proxy:response", this.ethSendRawTransactionResponse.bind(this));
  }

  protected get rawTransactionManager() {
    return (async () => {
      if (!this._rawTransactionManager) {
        const web3 = await this.web3;
        // RawTransactionManager doesn't support websockets, and uses the
        // currentProvider.host URI to communicate with the node over HTTP. Therefore, we can
        // populate currentProvider.host with our proxy HTTP endpoint, without affecting
        // web3's websocket connection.
        // @ts-ignore
        web3.eth.currentProvider.host = await this.events.request2("proxy:endpoint:http:get");

        this._rawTransactionManager = quorumjs.RawTransactionManager(web3, {
          privateUrl: this.embark.config.blockchainConfig.clientConfig?.tesseraPrivateUrl ?? TESSERA_PRIVATE_URL_DEFAULT
        });
      }
      return this._rawTransactionManager;
    })();
  }

  private async shouldHandle(params) {
    if (params.request.method !== blockchainConstants.transactionMethods.eth_sendRawTransaction) {
      return false;
    }

    const accounts = await this.accounts;
    if (!(accounts && accounts.length)) {
      return false;
    }

    // Only handle quorum requests that came via eth_sendTransaction
    // If the user wants to send a private raw tx directly,
    // web3.eth.sendRawPrivateTransaction should be used (which calls
    // eth_sendRawPrivateTransaction)
    const originalPayload = params.originalRequest?.params[0];
    const privateFor = originalPayload?.privateFor;
    const privateFrom = originalPayload?.privateFrom;
    if (!privateFor && !privateFrom) {
      return false;
    }

    const from = accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(originalPayload.from));
    if (!from?.privateKey) {
      return false;
    }

    return { originalPayload, privateFor, privateFrom, from };
  }

  private stripPrefix(value) {
    return value?.indexOf('0x') === 0 ? value.substring(2) : value;
  }

  private async ethSendRawTransactionRequest(params: any, callback: Callback<any>) {
    const shouldHandle = await this.shouldHandle(params);
    if (!shouldHandle) {
      return callback(null, params);
    }

    // manually send to the node in the response
    params.sendToNode = false;
    callback(null, params);
  }

  private async ethSendRawTransactionResponse(params: any, callback: Callback<any>) {
    const shouldHandle = await this.shouldHandle(params);
    if (!shouldHandle) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.request.method}' request:`));
    this.logger.trace(__(`Original request data: ${JSON.stringify({ request: params.request, response: params.response })}`));

    const { originalPayload, privateFor, privateFrom, from } = shouldHandle;
    const { gas, gasPrice, gasLimit, to, value, nonce, bytecodeWithInitParam, data } = originalPayload;

    try {
      const rawTransactionManager = await this.rawTransactionManager;

      const rawTx = {
        gasPrice: this.stripPrefix(gasPrice) ?? (0).toString(16),
        gasLimit: this.stripPrefix(gasLimit) ?? (4300000).toString(16),
        gas: this.stripPrefix(gas),
        to,
        value: this.stripPrefix(value) ?? (0).toString(16),
        data: bytecodeWithInitParam ?? data,
        from,
        isPrivate: true,
        privateFrom,
        privateFor,
        nonce
      };

      const { transactionHash } = await rawTransactionManager.sendRawTransaction(rawTx);
      params.response.result = transactionHash;
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
      return callback(null, params);
    } catch (err) {
      return callback(err);
    }
  }
}
