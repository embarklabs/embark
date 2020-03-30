import { sign, transaction } from "@omisego/omg-js-util";
import { Account, Embark } from "embark-core";
import { AccountParser, dappPath } from "embark-utils";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcInterceptor from "./rpcInterceptor";
import { handleSignRequest, isNodeAccount } from './utils/signUtils';
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";

export default class EthSignTypedData extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return /.*signTypedData.*/;
  }

  async interceptRequest(params: ProxyRequestParams<string>) {
    const nodeAccounts = await this.nodeAccounts;
    return handleSignRequest(nodeAccounts, params);
  }

  async interceptResponse(params: ProxyResponseParams<string, string>) {
    const [fromAddr, typedData] = params.request.params;
    const accounts = await this.accounts;
    const nodeAccounts = await this.nodeAccounts;

    if (isNodeAccount(nodeAccounts, fromAddr)) {
      // If it's a node account, we send the result because it should already be signed
      return params;
    }

    const account = accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(fromAddr));
    if (!(account && account.privateKey)) {
      throw new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
        "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr));
    }
    const toSign = transaction.getToSignHash(typeof typedData === "string" ? JSON.parse(typedData) : typedData);
    const signature = sign(toSign, [account.privateKey]);

    params.response.result = signature[0];
    return params;
  }
}
