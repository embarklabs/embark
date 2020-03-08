import { Embark } from "embark-core";
import RpcMutator from "./rpcMutator";
import { ProxyRequestParams, ProxyResponseParams, MutationOptions } from "embark-proxy";

export default class EthSubscribe extends RpcMutator {
  constructor(embark: Embark) {
    super(embark);
  }

  public async registerRpcMutations() {
    return Promise.all([
      this.embark.events.request2("rpc:request:mutation:register", /.*eth_subscribe.*/, this.ethSubscribeRequest.bind(this)),
      this.embark.events.request2("rpc:response:mutation:register", /.*eth_subscribe.*/, this.ethSubscribeResponse.bind(this))
    ]);
  }

  private async ethSubscribeRequest(params: ProxyRequestParams<string>, options: MutationOptions) {
    // check for websockets
    if (params.isWs) {
      // indicate that we do not want this call to go to the node
      params.sendToNode = false;
    }
    return params;
  }
  private async ethSubscribeResponse(params: ProxyResponseParams<string>, options: MutationOptions) {

    const { isWs, transport, request, response } = params;

    // check for websockets
    if (!isWs) {
      return params;
    }

    const nodeResponse = await this.events.request2("proxy:websocket:subscribe", transport, request, response);
    params.response = nodeResponse;

    return params;
  }
}
