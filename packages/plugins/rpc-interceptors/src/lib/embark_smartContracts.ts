import { Embark } from 'embark-core';
import { ProxyRequestParams, ProxyResponseParams } from 'embark-proxy';
import RpcInterceptor from "./rpcInterceptor";

export default class EmbarkSmartContracts extends RpcInterceptor {

  constructor(embark: Embark) {
    super(embark);
  }

  getFilter() {
    return 'embark_getSmartContracts';
  }

  async interceptRequest(params: ProxyRequestParams<any>) {
    params.sendToNode = false;
    return params;
  }

  async interceptResponse(params: ProxyResponseParams<any, any>) {
    params.response.result = await this.embark.events.request2('contracts:list');
    return params;
  }
}
