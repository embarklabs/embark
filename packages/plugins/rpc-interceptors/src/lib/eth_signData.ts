import { Account, Embark } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcInterceptor from "./rpcInterceptor";
import { handleSignRequest } from './utils/signUtils';
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";
import { AccountParser, dappPath } from "embark-utils";

export default class EthSignData extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return blockchainConstants.transactionMethods.eth_sign;
  }

  async interceptRequest(params: ProxyRequestParams<string>) {
    const nodeAccounts = await this.nodeAccounts;
    return handleSignRequest(nodeAccounts, params);
  }

  async interceptResponse(params: ProxyResponseParams<string, string>) {

    const [fromAddr, data] = params.request.params;

    const accounts = await this.accounts;
    const nodeAccounts = await this.nodeAccounts;

    const nodeAccount = nodeAccounts.find(acc => (
      Web3.utils.toChecksumAddress(acc) ===
      Web3.utils.toChecksumAddress(fromAddr)
    ));
    if (nodeAccount) {
      return params;
    }

    const account = accounts.find(acc => (
      Web3.utils.toChecksumAddress(acc.address) ===
      Web3.utils.toChecksumAddress(fromAddr)
    ));

    if (!(account && account.privateKey)) {
      throw new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
        "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr));
    }

    const signature = new Web3().eth.accounts.privateKeyToAccount(account.privateKey).sign(data).signature;
    params.response.result = signature;

    return params;
  }
}
