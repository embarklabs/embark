import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcModifier from "./rpcModifier";
import { sign, transaction } from "@omisego/omg-js-util";

// This class handles both eth_signData and eth_signTypedData
export default class EthSignData extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    this.embark.registerActionForEvent("blockchain:proxy:request", this.ethSignDataRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.ethSignDataResponse.bind(this));
  }

  private async ethSignDataRequest(params: any, callback: Callback<any>) {// check for:
    // - eth_sign
    // - eth_signTypedData
    // - eth_signTypedData_v3
    // - eth_signTypedData_v4
    // - personal_signTypedData (parity)
    if (params.request.method !== "eth_sign" && !params.request.method.includes("signTypedData")) {
      return callback(null, params);
    }

    try {
      const [fromAddr] = params.request.params;

      const account = this.nodeAccounts.find(acc => (
        Web3.utils.toChecksumAddress(acc) ===
        Web3.utils.toChecksumAddress(fromAddr)
      ));

      // If it's not a node account, we don't send it to the Node as it won't understand it
      if (!account) {
        params.sendToNode = false;
      }
    } catch (err) {
      return callback(err);
    }
    callback(null, params);
  }

  private async ethSignDataResponse(params: any, callback: Callback<any>) {
    // check for:
    // - eth_sign
    // - eth_signTypedData
    // - eth_signTypedData_v3
    // - eth_signTypedData_v4
    // - personal_signTypedData (parity)
    let isTypedData = false;
    if (params.request.method !== "eth_sign") {
      if (!params.request.method.includes("signTypedData")) {
        return callback(null, params);
      }
      isTypedData = true;
    }

    try {
      const [fromAddr, data] = params.request.params;

      const nodeAccount = this.nodeAccounts.find(acc => (
        Web3.utils.toChecksumAddress(acc) ===
        Web3.utils.toChecksumAddress(fromAddr)
      ));
      if (nodeAccount) {
        // If it's a node account, we send the result because it should already be signed
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

      if (isTypedData) {
        const toSign = transaction.getToSignHash(typeof data === "string" ? JSON.parse(data) : data);
        const signature = sign(toSign, [account.privateKey]);

        params.response.result = signature[0];
      } else {
        params.response.result = new Web3().eth.accounts.privateKeyToAccount(account.privateKey).sign(data).signature;
      }

      this.logger.trace(__(`Modified request/response data: ${JSON.stringify(params)}`));
    } catch (err) {
      return callback(err);
    }

    callback(null, params);
  }
}
