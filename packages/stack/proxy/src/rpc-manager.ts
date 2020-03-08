import { __ } from "embark-i18n";
import { Events } from "embark-core";
import { Account, Callback, Embark, EmbarkEvents } from "embark-core";
import { Logger } from 'embark-logger';
import { AccountParser, dappPath } from "embark-utils";
import { ProxyRequestParams, ProxyResponseParams } from '.';
import Web3 from "web3";

export interface MutationOptions {
  web3: Web3;
  accounts: Account[];
  nodeAccounts: string[];
  rpcMutationEvents: EmbarkEvents;
}

export type RpcRequestMutator<T> = (params: ProxyRequestParams<T>, options: MutationOptions) => ProxyRequestParams<T>;
export type RpcResponseMutator<T> = (params: ProxyResponseParams<T>, options: MutationOptions) => ProxyResponseParams<T>;

interface RegistrationOptions {
  priority: number;
}
interface RpcRegistration {
  filter: string | string[] | RegExp;
  options: RegistrationOptions;
}

interface RpcRequestRegistration<T> extends RpcRegistration {
  mutator: RpcRequestMutator<T>;
}

interface RpcResponseRegistration<T> extends RpcRegistration {
  mutator: RpcResponseMutator<T>;
}

export default class RpcManager {
  private _web3: Web3 | null = null;
  private rpcMutationEvents: EmbarkEvents;
  private logger: Logger;
  private events: EmbarkEvents;
  public _accounts: Account[] | null = null;
  public _nodeAccounts: string[] | null = null;
  private requestModifications: Array<RpcRequestRegistration<any>> = [];
  private responseModifications: Array<RpcResponseRegistration<any>> = [];
  constructor(private readonly embark: Embark) {
    this.events = embark.events;
    this.logger = embark.logger;
    this.rpcMutationEvents = new Events() as EmbarkEvents;
  }

  protected get web3() {
    return (async () => {
      if (!this._web3) {
        await this.events.request2("blockchain:started");
        // get connection directly to the node
        const provider = await this.events.request2("blockchain:node:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  private get nodeAccounts() {
    return (async () => {
      if (!this._nodeAccounts) {
        const web3 = await this.web3;
        this._nodeAccounts = await web3.eth.getAccounts();
      }
      return this._nodeAccounts || [];
    })();
  }

  private get accounts() {
    return (async () => {
      if (!this._accounts) {
        const web3 = await this.web3;
        const nodeAccounts = await this.nodeAccounts;
        this._accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, nodeAccounts);
      }
      return this._accounts || [];
    })();
  }

  public init() {
    this.registerActions();
    this.setCommandHandlers();
  }

  private registerActions() {
    this.embark.registerActionForEvent("tests:config:updated", { priority: 40 }, (_params, cb) => {
      // blockchain configs may have changed (ie endpoint)
      this._web3 = null;

      // web.eth.getAccounts may return a different value now
      // update accounts across all modifiers
      this.updateAccounts(cb);
    });

    this.embark.registerActionForEvent("blockchain:proxy:request", this.onProxyRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.onProxyResponse.bind(this));
  }

  private setCommandHandlers() {
    this.rpcMutationEvents.setCommandHandler("nodeAccounts:updated", this.updateAccounts.bind(this));

    this.events.setCommandHandler("rpc:request:mutation:register", this.registerRequestMutation.bind(this));
    this.events.setCommandHandler("rpc:response:mutation:register", this.registerResponseMutation.bind(this));
  }

  private async onProxyRequest(params: ProxyRequestParams, callback: Callback<ProxyRequestParams>) {
    try {
      params = this.executeMutations(this.requestModifications, params);
    } catch (err) {
      err.message = __("Error executing RPC request modifications for '%s': %s", params?.request?.method, err.message);
      return callback(err);
    }
    callback(null, params);
  }

  private async onProxyResponse(params: ProxyResponseParams, callback: Callback<ProxyResponseParams>) {
    try {
      params = this.executeMutations(this.responseModifications, params);
    } catch (err) {
      err.message = __("Error executing RPC response modifications for '%s': %s", params?.request?.method, err.message);
      return callback(err);
    }
    callback(null, params);
  }

  private registerRequestMutation(filter: string | RegExp, mutator: RpcRequestMutator<any>, options: RegistrationOptions = { priority: 50 }, callback: Callback<null>) {
    this.requestModifications.push({ filter, options, mutator });
    callback();
  }

  private registerResponseMutation(filter: string | RegExp, mutator: RpcResponseMutator<any>, options: RegistrationOptions = { priority: 50 }, callback: Callback<null>) {
    this.responseModifications.push({ filter, options, mutator });
    callback();
  }

  private async updateAccounts(cb: Callback<null>) {
    this._nodeAccounts = null;
    this._accounts = null;
    cb();
  }

  private async executeMutations(mods: Array<RpcRequestRegistration<any>> | Array<RpcResponseRegistration<any>>, params: ProxyRequestParams<any> | ProxyResponseParams<any>) {
    const web3 = await this.web3;
    const accounts = await this.accounts;
    const nodeAccounts = await this.nodeAccounts;
    const { method } = params.request;
    const modsToRun = mods
      .filter((mod) => this.shouldModify(mod, method))
      .sort(this.sortByPriority);
    for (const mod of modsToRun) {
      // this.logger.trace(__(`Modifying blockchain '${params.request.method}' request:`));
      // this.logger.trace(__(`Original request data: ${JSON.stringify({ request: params.request, response: params.response })}`));

      params = await mod.mutator(params, { web3, accounts, nodeAccounts, rpcMutationEvents: this.rpcMutationEvents });

      // this.logger.trace(__(`Modified request/response data: ${JSON.stringify({ request: params.request, response: params.response })}`));
    }
    return params;
  }

  private shouldModify(mod: RpcRequestRegistration<any> | RpcResponseRegistration<any>, method: string) {
    let applyModification = false;
    if (mod.filter instanceof RegExp) {
      applyModification = mod.filter.test(method);
    } else if (typeof mod.filter === "string") {
      applyModification = (mod.filter === method);
    } else if (Array.isArray(mod.filter)) {
      applyModification = mod.filter.includes(method);
    }
    return applyModification;
  }

  private sortByPriority(a: RpcRequestRegistration<any> | RpcResponseRegistration<any>, b: RpcRequestRegistration<any> | RpcResponseRegistration<any>) {
    const aPriority = a.options.priority;
    const bPriority = b.options.priority;
    if (aPriority < bPriority) {
      return -1;
    }
    if (aPriority > bPriority) {
      return 1;
    }
    return 0;
  }
}
