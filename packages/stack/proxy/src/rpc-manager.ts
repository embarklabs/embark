import { __ } from "embark-i18n";
import { Events } from "embark-core";
import { Account, Callback, Embark, EmbarkEvents } from "embark-core";
import { Logger } from 'embark-logger';
import { AccountParser, dappPath } from "embark-utils";
import { ProxyRequestParams, ProxyResponseParams } from '.';

export type RpcRequestInterceptor<T> = (params: ProxyRequestParams<T>) => ProxyRequestParams<T>;
export type RpcResponseInterceptor<T, R> = (params: ProxyRequestParams<T> | ProxyResponseParams<T, R>) => ProxyResponseParams<T, R>;

interface RegistrationOptions {
  priority: number;
}

interface RpcRegistration {
  filter: string | string[] | RegExp;
  options: RegistrationOptions;
}

interface RpcRequestRegistration<T> extends RpcRegistration {
  interceptor: RpcRequestInterceptor<T>;
}

interface RpcResponseRegistration<T, R> extends RpcRegistration {
  interceptor: RpcResponseInterceptor<T, R>;
}

export default class RpcManager {

  private logger: Logger;

  private events: EmbarkEvents;

  private requestInterceptors: Array<RpcRequestRegistration<any>> = [];

  private responseInterceptors: Array<RpcResponseRegistration<any, any>> = [];

  constructor(private readonly embark: Embark) {
    this.events = embark.events;
    this.logger = embark.logger;
  }

  public init() {
    this.registerActions();
    this.setCommandHandlers();
  }

  private registerActions() {
    this.embark.registerActionForEvent("blockchain:proxy:request", this.onProxyRequest.bind(this));
    this.embark.registerActionForEvent("blockchain:proxy:response", this.onProxyResponse.bind(this));
  }

  private setCommandHandlers() {
    this.events.setCommandHandler("rpc:request:interceptor:register", this.registerRequestInterceptor.bind(this));
    this.events.setCommandHandler("rpc:response:interceptor:register", this.registerResponseInterceptor.bind(this));
  }

  private async onProxyRequest<TRequest>(params: ProxyRequestParams<TRequest>, callback: Callback<ProxyRequestParams<TRequest>>) {
    try {
      params = await this.executeInterceptors(this.requestInterceptors, params);
    } catch (err) {
      err.message = __("Error executing RPC request modifications for '%s': %s", params?.request?.method, err.message);
      return callback(err);
    }
    callback(null, params);
  }

  private async onProxyResponse<TRequest, TResponse>(params: ProxyResponseParams<TRequest, TResponse>, callback: Callback<ProxyResponseParams<TRequest, TResponse>>) {
    try {
      params = await this.executeInterceptors(this.responseInterceptors, params);
    } catch (err) {
      err.message = __("Error executing RPC response modifications for '%s': %s", params?.request?.method, err.message);
      return callback(err);
    }
    callback(null, params);
  }

  private registerRequestInterceptor<TRequest>(
    filter: string | RegExp,
    interceptor: RpcRequestInterceptor<TRequest>,
    options: RegistrationOptions = { priority: 50 },
    callback?: Callback<null>
  ) {
    this.requestInterceptors.push({ filter, options, interceptor });
    if (callback) {
      callback();
    }
  }

  private registerResponseInterceptor<TRequest, TResponse>(
    filter: string | RegExp,
    interceptor: RpcResponseInterceptor<TRequest, TResponse>,
    options: RegistrationOptions = { priority: 50 },
    callback?: Callback<null>
  ) {
    this.responseInterceptors.push({ filter, options, interceptor });
    if (callback) {
      callback();
    }
  }

  private async executeInterceptors<T>(
    registrations: Array<RpcRequestRegistration<T>>,
    params: ProxyRequestParams<T>
  ): Promise<ProxyRequestParams<T>>;
  private async executeInterceptors<T, R>(
    registrations: Array<RpcResponseRegistration<T, R>>,
    params: ProxyResponseParams<T, R>
  ): Promise<ProxyResponseParams<T, R>>;
  private async executeInterceptors<T, R>(
    registrations: Array<RpcRequestRegistration<T> | RpcResponseRegistration<T, R>>,
    params: ProxyRequestParams<T> | ProxyResponseParams<T, R>
  ): Promise<ProxyRequestParams<T> | ProxyResponseParams<T, R>> {
    const { method } = params.request;
    const registrationsToRun = registrations
      .filter(registration => this.shouldIntercept(registration.filter, method))
      .sort((a, b) => this.sortByPriority(a.options.priority, b.options.priority));

    for (const registration of registrationsToRun) {
      params = await registration.interceptor(params);
    }
    return params;
  }

  private shouldIntercept(filter: string | string[] | RegExp, method: string) {
    let applyModification = false;
    if (filter instanceof RegExp) {
      applyModification = filter.test(method);
    } else if (typeof filter === "string") {
      applyModification = (filter === method);
    } else if (Array.isArray(filter)) {
      applyModification = filter.includes(method);
    }
    return applyModification;
  }

  private sortByPriority<T>(a: number, b: number) {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  }
}
