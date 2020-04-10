import { Account, Embark } from "embark-core";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";
import { AccountParser, dappPath } from "embark-utils";
import quorumjs from "quorum-js";

const TESSERA_PRIVATE_URL_DEFAULT = "http://localhost:9081";

declare module "embark-core" {
  interface ClientConfig {
    tesseraPrivateUrl?: string;
  }
}
export default class EthSendRawTransaction {

  private _rawTransactionManager: any;

  private _web3: Web3 | null = null;

  public _accounts: Account[] | null = null;

  public _nodeAccounts: string[] | null = null;

  constructor(private embark: Embark) { }

  protected get web3() {
    return (async () => {
      if (!this._web3) {
        await this.embark.events.request2("blockchain:started");
        // get connection directly to the node
        const provider = await this.embark.events.request2("blockchain:node:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  private get nodeAccounts() {
    return (async () => {
      if (!this._nodeAccounts) {
        const web3 = await this.web3;
        this._nodeAccounts = await web3.eth.getAccounts();
      }
      return this._nodeAccounts || [];
    })();
  }

  private get accounts() {
    return (async () => {
      if (!this._accounts) {
        const web3 = await this.web3;
        const nodeAccounts = await this.nodeAccounts;
        this._accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.embark.logger, nodeAccounts);
      }
      return this._accounts || [];
    })();
  }

  getFilter() {
    return blockchainConstants.transactionMethods.eth_sendRawTransaction;
  }

  private get rawTransactionManager() {
    return (async () => {
      if (this._rawTransactionManager) {
        return this._rawTransactionManager;
      }
      // RawTransactionManager doesn't support websockets, and uses the
      // currentProvider.host URI to communicate with the node over HTTP. Therefore, we can
      // populate currentProvider.host with our proxy HTTP endpoint, without affecting
      // web3's websocket connection.
      // @ts-ignore
      web3.eth.currentProvider.host = await this.embark.events.request2("proxy:endpoint:http:get");
      const web3 = await this.web3;
      this._rawTransactionManager = quorumjs.RawTransactionManager(web3, {
        privateUrl: this.embark.config.blockchainConfig.clientConfig?.tesseraPrivateUrl ?? TESSERA_PRIVATE_URL_DEFAULT
      });
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

  async interceptRequest(params: ProxyRequestParams<string>) {
    const shouldHandle = await this.shouldHandle(params);
    if (!shouldHandle) {
      return params;
    }

    // manually send to the node in the response
    params.sendToNode = false;
    return params;
  }

  async interceptResponse(params: ProxyResponseParams<string, any>) {
    const shouldHandle = await this.shouldHandle(params);
    if (!shouldHandle) {
      return params;
    }

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
