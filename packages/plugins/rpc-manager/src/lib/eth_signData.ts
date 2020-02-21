import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcModifier from "./rpcModifier";
import {handleSignRequest} from './utils/signUtils';

export default class EthSignData extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    this.embark.registerActionForEvent("blockchain:proxy:request", this.ethSignDataRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.ethSignDataResponse.bind(this));
  }

  private async ethSignDataRequest(params: any, callback: Callback<any>) {
    if (params.request.method !== "eth_sign") {
      return callback(null, params);
    }

    handleSignRequest(this.nodeAccounts, params, callback);
  }

  private async ethSignDataResponse(params: any, callback: Callback<any>) {
    if (params.request.method !== "eth_sign") {
      return callback(null, params);
    }

    try {
      const [fromAddr, data] = params.request.params;

      const nodeAccount = this.nodeAccounts.find(acc => (
        Web3.utils.toChecksumAddress(acc) ===
        Web3.utils.toChecksumAddress(fromAddr)
      ));
      if (nodeAccount) {
        return callback(null, params);
      }

      this.logger.trace(__(`Modifying blockchain '${params.request.method}' response:`));
      this.logger.trace(__(`Original request/response data: ${JSON.stringify(params)}`));

      const account = this.accounts.find(acc => (
        Web3.utils.toChecksumAddress(acc.address) ===
          Web3.utils.toChecksumAddress(fromAddr)
      ));

      if (!(account && account.privateKey)) {
        return callback(
          new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
                       "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr)));
      }

      const signature = new Web3().eth.accounts.privateKeyToAccount(account.privateKey).sign(data).signature;
      params.response.result = signature;

      this.logger.trace(__(`Modified request/response data: ${JSON.stringify(params)}`));
    } catch (err) {
      return callback(err);
    }

    callback(null, params);
  }
}
