import { sign, transaction } from "@omisego/omg-js-util";
import { Embark } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcMutator from "./rpcMutator";
import { handleSignRequest, isNodeAccount } from './utils/signUtils';
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams, MutationOptions } from "embark-proxy";

export default class EthSignTypedData extends RpcMutator {
  constructor(embark: Embark) {
    super(embark);
  }

  public async registerRpcMutations() {
    return Promise.all([
      // check for:
      // - eth_signTypedData
      // - eth_signTypedData_v3
      // - eth_signTypedData_v4
      // - personal_signTypedData (parity)
      this.embark.events.request2("rpc:request:mutation:register", /.*signTypedData.*/, this.ethSignTypedDataRequest.bind(this)),
      this.embark.events.request2("rpc:response:mutation:register", /.*signTypedData.*/, this.ethSignTypedDataResponse.bind(this))
    ]);
  }

  private async ethSignTypedDataRequest(params: ProxyRequestParams<string>, options: MutationOptions) {
    const { nodeAccounts } = options;
    return handleSignRequest(nodeAccounts, params);
  }

  private async ethSignTypedDataResponse(params: ProxyResponseParams<string>, options: MutationOptions) {
    const [fromAddr, typedData] = params.request.params;
    const { accounts, nodeAccounts } = options;

    if (isNodeAccount(nodeAccounts, fromAddr)) {
      // If it's a node account, we send the result because it should already be signed
      return params;
    }

    const account = accounts.find((acc) => Web3.utils.toChecksumAddress(acc.address) === Web3.utils.toChecksumAddress(fromAddr));
    if (!(account && account.privateKey)) {
      throw new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
        "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr));
    }
    const toSign = transaction.getToSignHash(typeof typedData === "string" ? JSON.parse(typedData) : typedData);
    const signature = sign(toSign, [account.privateKey]);

    params.response.result = signature[0];
    return params;
  }
}
