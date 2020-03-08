import { Embark } from "embark-core";
import { __ } from "embark-i18n";
import Web3 from "web3";
import RpcMutator from "./rpcMutator";
import { handleSignRequest } from './utils/signUtils';
const { blockchain: blockchainConstants } = require("embark-core/constants");
import { ProxyRequestParams, ProxyResponseParams, MutationOptions } from "embark-proxy";

export default class EthSignData extends RpcMutator {
  constructor(embark: Embark) {
    super(embark);
  }

  public async registerRpcMutations() {
    return Promise.all([
      this.embark.events.request2("rpc:request:mutation:register", blockchainConstants.transactionMethods.eth_sign, this.ethSignDataRequest.bind(this)),
      this.embark.events.request2("rpc:response:mutation:register", blockchainConstants.transactionMethods.eth_sign, this.ethSignDataResponse.bind(this))
    ]);
  }

  private async ethSignDataRequest(params: ProxyRequestParams<string>, options: MutationOptions) {
    const { nodeAccounts } = options;
    return handleSignRequest(nodeAccounts, params);
  }

  private async ethSignDataResponse(params: ProxyResponseParams<string, string>, options: MutationOptions) {

    const [fromAddr, data] = params.request.params;
    const { accounts, nodeAccounts } = options;

    const nodeAccount = nodeAccounts.find(acc => (
      Web3.utils.toChecksumAddress(acc) ===
      Web3.utils.toChecksumAddress(fromAddr)
    ));
    if (nodeAccount) {
      return params;
    }

    const account = accounts.find(acc => (
      Web3.utils.toChecksumAddress(acc.address) ===
      Web3.utils.toChecksumAddress(fromAddr)
    ));

    if (!(account && account.privateKey)) {
      throw new Error(__("Could not sign transaction because Embark does not have a private key associated with '%s'. " +
        "Please ensure you have configured your account(s) to use a mnemonic, privateKey, or privateKeyFile.", fromAddr));
    }

    const signature = new Web3().eth.accounts.privateKeyToAccount(account.privateKey).sign(data).signature;
    params.response.result = signature;

    return params;
  }
}
