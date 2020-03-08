import { Embark } from "embark-core";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams, MutationOptions } from "embark-proxy";
import quorumjs from "quorum-js";

const TESSERA_PRIVATE_URL_DEFAULT = "http://localhost:9081";

declare module "embark-core" {
  interface ClientConfig {
    tesseraPrivateUrl?: string;
  }
}
export default class EthSendRawTransaction {
  private _rawTransactionManager: any;
  private web3: Web3 | null = null;
  constructor(private embark: Embark) { }

  public async registerRpcMutations() {
    return Promise.all([
      this.embark.events.request2("rpc:request:mutation:register", blockchainConstants.transactionMethods.eth_sendRawTransaction, this.ethSendRawTransactionRequest.bind(this)),
      this.embark.events.request2("rpc:response:mutation:register", blockchainConstants.transactionMethods.eth_sendRawTransaction, this.ethSendRawTransactionResponse.bind(this))
    ]);
  }

  private get rawTransactionManager() {
    return (async () => {
      if (!this._rawTransactionManager) {
        // RawTransactionManager doesn't support websockets, and uses the
        // currentProvider.host URI to communicate with the node over HTTP. Therefore, we can
        // populate currentProvider.host with our proxy HTTP endpoint, without affecting
        // web3's websocket connection.
        // @ts-ignore
        web3.eth.currentProvider.host = await this.events.request2("proxy:endpoint:http:get");

        this._rawTransactionManager = quorumjs.RawTransactionManager(this.web3, {
          privateUrl: this.embark.config.blockchainConfig.clientConfig?.tesseraPrivateUrl ?? TESSERA_PRIVATE_URL_DEFAULT
        });
      }
      return this._rawTransactionManager;
    })();
  }

  private async shouldHandle(params, accounts) {
    if (params.request.method !== blockchainConstants.transactionMethods.eth_sendRawTransaction) {
      return false;
    }

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

  private async ethSendRawTransactionRequest(params: ProxyRequestParams<string>, options: MutationOptions) {
    const shouldHandle = await this.shouldHandle(params, options);
    if (!shouldHandle) {
      return params;
    }

    this.web3 = options.web3;

    // manually send to the node in the response
    params.sendToNode = false;
    return params;
  }

  private async ethSendRawTransactionResponse(params: ProxyResponseParams<string>, options: MutationOptions) {
    const shouldHandle = await this.shouldHandle(params, options);
    if (!shouldHandle) {
      return params;
    }

    this.web3 = options.web3;

    const { originalPayload, privateFor, privateFrom, from } = shouldHandle;
    const { gas, gasPrice, gasLimit, to, value, nonce, bytecodeWithInitParam, data } = originalPayload;

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

    return params;
  }
}
