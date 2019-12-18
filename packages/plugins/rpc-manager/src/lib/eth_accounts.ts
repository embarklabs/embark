import { Callback, Embark, EmbarkEvents } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { __ } from "embark-i18n";
import { Logger } from "embark-logger";
import Web3 from "web3";
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
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents) {
    super(embark, rpcModifierEvents);

    this.init();
  }

  private async init() {
    const nodeAccounts = await this.nodeAccounts;
    this.rpcModifierEvents.request2("nodeAccounts:updated", nodeAccounts);

    this.embark.registerActionForEvent("blockchain:proxy:response", this.ethAccountsResponse.bind(this));
  }

  private async ethAccountsResponse(params: any, callback: Callback<any>) {

    if (!(METHODS_TO_MODIFY.includes(params.request.method))) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.request.method}' response:`));
    this.logger.trace(__(`Original request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));

    try {
      if (!arrayEqual(params.response.result, this._nodeAccounts || [])) {
        // reset backing variables so accounts is recalculated
        await this.rpcModifierEvents.request2("nodeAccounts:updated", params.response.result);
      }
      const accounts = await this.accounts;
      if (!(accounts && accounts.length)) {
        return callback(null, params);
      }

      params.response.result = accounts.map((acc) => acc.address || acc);
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
    } catch (err) {
      return callback(err);
    }

    return callback(null, params);
  }
}
