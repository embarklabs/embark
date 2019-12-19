import { Callback, Embark, EmbarkEvents } from "embark-core";
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcModifier from "./rpcModifier";

const METHODS_TO_MODIFY = [
  blockchainConstants.transactionMethods.eth_accounts,
  blockchainConstants.transactionMethods.personal_listAccounts,
];

export default class EthAccounts extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    this.embark.registerActionForEvent("blockchain:proxy:response", this.ethAccountsResponse.bind(this));
  }

  private async ethAccountsResponse(params: any, callback: Callback<any>) {

    if (!(METHODS_TO_MODIFY.includes(params.request.method))) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.request.method}' response:`));
    this.logger.trace(__(`Original request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));

    try {
      if (!(this.accounts && this.accounts.length)) {
        return callback(null, params);
      }

      params.response.result = this.accounts.map((acc) => acc.address);
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
    } catch (err) {
      return callback(err);
    }

    return callback(null, params);
  }
}
