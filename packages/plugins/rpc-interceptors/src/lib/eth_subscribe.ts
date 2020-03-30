import { Embark } from "embark-core";
import RpcInterceptor from "./rpcInterceptor";
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";

export default class EthSubscribe extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return 'eth_subscribe';
  }

  async interceptRequest(params: ProxyRequestParams<string>) {
    // check for websockets
    if (params.isWs) {
      // indicate that we do not want this call to go to the node
      params.sendToNode = false;
    }
    return params;
  }
  async interceptResponse(params: ProxyResponseParams<string, any>) {

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
