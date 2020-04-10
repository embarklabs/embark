import { Embark } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcInterceptor from "./rpcInterceptor";
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";

export default class PersonalNewAccount extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return blockchainConstants.transactionMethods.personal_newAccount;
  }

  async interceptRequest(params: ProxyRequestParams<string>) {
    return params;
  }

  async interceptResponse(params: ProxyResponseParams<string, string>) {
    // emit event so tx modifiers can refresh accounts
    await this.events.request2("rpc:accounts:reset");
    return params;
  }
}
