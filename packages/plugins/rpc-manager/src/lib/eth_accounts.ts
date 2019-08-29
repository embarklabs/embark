import { Callback, Embark, Events, Logger } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import Web3 from "web3";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { __ } from "embark-i18n";
import RpcModifier from "./rpcModifier";

const METHODS_TO_MODIFY = [
  blockchainConstants.transactionMethods.eth_accounts,
  blockchainConstants.transactionMethods.personal_listAccounts,
];

function arrayEqual(arrayA: string[], arrayB: string[]) {
  if (!(arrayA && arrayB) || arrayA.length !== arrayB.length) {
    return false;
  } else {
    return arrayA.every((address, index) => Web3.utils.toChecksumAddress(address) === Web3.utils.toChecksumAddress(arrayB[index]));
  }
}

export default class EthAccounts extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: Events) {
    super(embark, rpcModifierEvents);

    this.embark.registerActionForEvent("blockchain:proxy:response", undefined, this.checkResponseFor_eth_accounts.bind(this));
  }

  private async checkResponseFor_eth_accounts(params: any, callback: Callback<any>) {

    if (!(METHODS_TO_MODIFY.includes(params.reqData.method))) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.reqData.method}' response:`));
    this.logger.trace(__(`Original request/response data: ${JSON.stringify(params)}`));

    try {
      if (!arrayEqual(params.respData.result, this._nodeAccounts || [])) {
        // reset backing variables so accounts is recalculated
        await this.rpcModifierEvents.request2("nodeAccounts:updated", params.respData.result);
      }
      const accounts = await this.accounts;
      if (!(accounts && accounts.length)) {
        return callback(null, params);
      }

      params.respData.result = accounts.map((acc) => acc.address || acc);
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify(params)}`));
    } catch (err) {
      return callback(err);
    }

    return callback(null, params);
  }
}
