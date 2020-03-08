import { Embark } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import RpcMutator from "./rpcMutator";
import { ProxyResponseParams, MutationOptions } from "embark-proxy";

export default class PersonalNewAccount extends RpcMutator {
  constructor(embark: Embark) {
    super(embark);
  }

  public async registerRpcMutations() {
    return this.embark.events.request2("rpc:response:mutation:register", blockchainConstants.transactionMethods.personal_newAccount, this.personalNewAccountResponse.bind(this));
  }

  private async personalNewAccountResponse(params: ProxyResponseParams<string>, options: MutationOptions) {
    // emit event so tx modifiers can refresh accounts
    await options.rpcMutationEvents.request2("nodeAccounts:updated");

    return params;
  }
}
