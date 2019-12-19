import { Callback, Embark, EmbarkEvents } from "embark-core";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { __ } from "embark-i18n";
import RpcModifier from "./rpcModifier";
export default class PersonalNewAccount extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    embark.registerActionForEvent("blockchain:proxy:response", this.personalNewAccountResponse.bind(this));
  }

  private async personalNewAccountResponse(params: any, callback: Callback<any>) {
    if (params.request.method !== blockchainConstants.transactionMethods.personal_newAccount) {
      return callback(null, params);
    }

    // emit event so tx modifiers can refresh accounts
    await this.rpcModifierEvents.request2("nodeAccounts:updated");

    callback(null, params);
  }
}
