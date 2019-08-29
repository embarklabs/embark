import { Callback, Embark, Events } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { __ } from "embark-i18n";
import RpcModifier from "./rpcModifier";
export default class PersonalNewAccount extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: Events) {
    super(embark, rpcModifierEvents);

    embark.registerActionForEvent("blockchain:proxy:response", undefined, this.checkResponseFor_personal_newAccount.bind(this));
  }

  private async checkResponseFor_personal_newAccount(params: any, callback: Callback<any>) {
    if (params.reqData.method !== blockchainConstants.transactionMethods.personal_newAccount) {
      return callback(null, params);
    }

    // emit event so tx modifiers can refresh accounts
    await this.rpcModifierEvents.request2("nodeAccounts:added", params.respData.result);

    callback(null, params);
  }
}
