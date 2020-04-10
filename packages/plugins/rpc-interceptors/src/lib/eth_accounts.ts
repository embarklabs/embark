import { Embark } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcInterceptor from "./rpcInterceptor";
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";

export default class EthAccounts extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return [
      blockchainConstants.transactionMethods.eth_accounts,
      blockchainConstants.transactionMethods.personal_listAccounts
    ];
  }

  async interceptRequest(params: ProxyRequestParams<string>) {
    return params;
  }

  public async interceptResponse(params: ProxyResponseParams<string, any>) {
    const accounts = await this.accounts;
    if (!accounts?.length) {
      return params;
    }
    params.response.result = accounts.map((acc) => acc.address);
    return params;
  }
}
