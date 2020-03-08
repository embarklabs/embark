import { Embark } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcMutator from "./rpcMutator";
import { ProxyResponseParams, MutationOptions } from "embark-proxy";

export default class EthAccounts extends RpcMutator {
  constructor(embark: Embark) {
    super(embark);
  }

  public async registerRpcMutations() {
    return this.embark.events.request2(
      "rpc:response:mutation:register",
      [blockchainConstants.transactionMethods.eth_accounts,
      blockchainConstants.transactionMethods.personal_listAccounts],
      this.ethAccountsResponse.bind(this)
    );
  }

  private async ethAccountsResponse(params: ProxyResponseParams<string>, options: MutationOptions) {
    const { accounts } = options;
    if (!accounts?.length) {
      return params;
    }

    params.response.result = accounts.map((acc) => acc.address);

    return params;
  }
}
