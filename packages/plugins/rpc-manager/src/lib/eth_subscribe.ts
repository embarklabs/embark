import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import RpcModifier from "./rpcModifier";
import Web3 from "web3";

export default class EthSubscribe extends RpcModifier {
  constructor(embark: Embark, rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web3: Web3) {
    super(embark, rpcModifierEvents, nodeAccounts, accounts, web3);

    embark.registerActionForEvent("blockchain:proxy:request", this.ethSubscribeRequest.bind(this));
    embark.registerActionForEvent("blockchain:proxy:response", this.ethSubscribeResponse.bind(this));
  }

  private async ethSubscribeRequest(params: any, callback: Callback<any>) {
    // check for eth_subscribe and websockets
    if (params.isWs && params.request.method === "eth_subscribe") {
      // indicate that we do not want this call to go to the node
      params.sendToNode = false;
      return callback(null, params);
    }
    callback(null, params);
  }
  private async ethSubscribeResponse(params: any, callback: Callback<any>) {

    const { isWs, transport, request, response } = params;

    // check for eth_subscribe and websockets
    if (!(isWs && request.method.includes("eth_subscribe"))) {
      return callback(null, params);
    }

    this.logger.trace(__(`Modifying blockchain '${request.method}' response:`));
    this.logger.trace(__(`Original request/response data: ${JSON.stringify({ request, response })}`));

    try {
      const nodeResponse = await this.events.request2("proxy:websocket:subscribe", transport, request, response);
      params.response = nodeResponse;
      this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request, response: params.response })}`));
    } catch (err) {
      return callback(err);
    }
    callback(null, params);
  }
}
