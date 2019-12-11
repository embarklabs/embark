import { sign, transaction } from "@omisego/omg-js-util";
import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import { Logger } from "embark-logger";
import Web3 from "web3";
import RpcModifier from "./rpcModifier";

export default class EthSignTypedData extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents) {
    super(embark, rpcModifierEvents);

    this.embark.registerActionForEvent("blockchain:proxy:request", this.ethSignTypedDataRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.ethSignTypedDataResponse.bind(this));
  }

  private async ethSignTypedDataRequest(params: any, callback: Callback<any>) {
    // check for:
    // - eth_signTypedData
    // - eth_signTypedData_v3
    // - eth_signTypedData_v4
    // - personal_signTypedData (parity)
    if (params.request.method.includes("signTypedData")) {
      // indicate that we do not want this call to go to the node
      params.sendToNode = false;
      return callback(null, params);
    }
    callback(null, params);
  }
  private async ethSignTypedDataResponse(params: any, callback: Callback<any>) {

    // check for:
    // - eth_signTypedData
    // - eth_signTypedData_v3
    // - eth_signTypedData_v4
    // - personal_signTypedData (parity)
    if (!params.request.method.includes("signTypedData")) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${params.request.method}' response:`));
    this.logger.trace(__(`Original request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));

    try {
      const accounts = await this.accounts;
      const [fromAddr, typedData] = params.request.params;
      const account = accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(fromAddr));
      if (!(account && account.privateKey)) {
        return callback(
          new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
            "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr)));
      }
      const toSign = transaction.getToSignHash(typeof typedData === "string" ? JSON.parse(typedData) : typedData);
      const signature = sign(toSign, [account.privateKey]);

      params.response.result = signature[0];
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
    } catch (err) {
      return callback(err);
    }
    callback(null, params);
  }
}
