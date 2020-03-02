import { __ } from 'embark-i18n';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import { isDebug } from 'embark-utils';
const Web3RequestManager = require('web3-core-requestmanager');

const ACTION_TIMEOUT = isDebug() ? 30000 : 10000;

export class Proxy {
  constructor(options) {
    this.transactions = {};
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.app = null;
    this.events = options.events;
    this.isWs = options.isWs;
    this.nodeSubscriptions = {};
    this._requestManager = null;

    this.events.setCommandHandler("proxy:websocket:subscribe", this.handleSubscribe.bind(this));
    this.events.setCommandHandler("proxy:websocket:unsubscribe", this.handleUnsubscribe.bind(this));
  }

  // used to service all non-long-living WS connections, including any
  // request that is not WS and any WS request that is not an `eth_subscribe`
  // RPC request
  get requestManager() {
    return (async () => {
      if (!this._requestManager) {
        const provider = await this._createWebSocketProvider();
        this._requestManager = this._createWeb3RequestManager(provider);
      }
      return this._requestManager;
    })();
  }

  async _createWebSocketProvider() {
    return this.events.request2("blockchain:node:provider");
  }

  _createWeb3RequestManager(provider) {
    const manager =  new Web3RequestManager.Manager(provider);
    // Up max listener because the default 10 limit is too low for all the events the proxy handles
    // Warning mostly appeared in tests. The warning is also only with the Ganache provider
    // eslint-disable-next-line no-unused-expressions
    manager.provider?.setMaxListeners?.(100);
    return manager;
  }

  async nodeReady() {
    try {
      const reqMgr = await this.requestManager;
      // Using net_version instead of eth_accounts, because eth_accounts can fail if EIP1102 is not approved first
      await reqMgr.send({ method: 'net_version' });
    } catch (e) {
      this.logger.debug(e);
      throw new Error(__(`Unable to connect to the blockchain endpoint`));
    }
  }

  async serve(localHost, localPort) {

    await this.nodeReady();

    this.app = express();
    if (this.isWs) {
      expressWs(this.app);
    }

    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    if (this.isWs) {
      this.app.ws('/', async (conn, wsReq) => {

        // Up max listener because the default 10 limit is too low for all the events the proxy handles
        // Warning mostly appeared in tests
        conn.setMaxListeners(100);
        conn.on('message', async (msg) => {
          try {
            const jsonMsg = JSON.parse(msg);
            await this.processRequest(jsonMsg, conn);
          }
          catch (err) {
            const error = __('Error processing request: %s', err.message);
            this.logger.error(error);
            this.logger.debug(`Request causing error: ${JSON.stringify(wsReq)}`);
            this.respondWs(conn, error);
          }
        });
      });
    } else {
      // HTTP
      this.app.use(async (req, res) => {
        // Modify request
        try {
          await this.processRequest(req, res);
        }
        catch (err) {
          const error = __('Error processing request: %s', err.message);
          this.logger.error(error);
          this.respondHttp(res, 500, error);
        }
      });
    }

    return new Promise(resolve => {
      this.server = this.app.listen(localPort, localHost, null,
        () => {
          resolve(this.app);
        });
    });
  }

  async processRequest(request, transport) {
    // Modify request
    let modifiedRequest;
    request = request.method === "POST" ? request.body : request;
    try {
      modifiedRequest = await this.emitActionsForRequest(request, transport);
    }
    catch (reqError) {
      const error = reqError.message || reqError;
      this.logger.error(__(`Error executing request actions: ${error}`));
      // TODO: Change error code to be more specific. Codes in section 5.1 of the JSON-RPC spec: https://www.jsonrpc.org/specification
      const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": request.id };
      return this.respondError(transport, rpcErrorObj);
    }

    // Send the possibly modified request to the Node
    const response = { jsonrpc: "2.0", id: modifiedRequest.request.id };
    if (modifiedRequest.sendToNode !== false) {

      try {
        response.result = await this.forwardRequestToNode(modifiedRequest.request);
      } catch (fwdReqErr) {
        // The node responded with an error. Set up the error so that it can be
        // stripped out by modifying the response (via actions for blockchain:proxy:response)
        response.error = fwdReqErr.message || fwdReqErr;
      }
    }

    try {
      const modifiedResp = await this.emitActionsForResponse(modifiedRequest, response, transport);
      // Send back to the client
      if (modifiedResp && modifiedResp.response && modifiedResp.response.error) {
        // error returned from the node and it wasn't stripped by our response actions
        const error = modifiedResp.response.error.message || modifiedResp.response.error;
        this.logger.debug(__(`Error returned from the node: ${error}`));
        const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedResp.response.id };
        return this.respondError(transport, rpcErrorObj);
      }
      this.respondOK(transport, modifiedResp.response);
    }
    catch (resError) {
      // if was an error in response actions (resError), send the error in the response
      const error = resError.message || resError;
      this.logger.error(__(`Error executing response actions: ${error}`));
      const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedRequest.request.id };
      return this.respondError(transport, rpcErrorObj);
    }
  }

  async forwardRequestToNode(request) {
    const reqMgr = await this.requestManager;
    let reject, resolve;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    reqMgr.send(request, (fwdReqErr, result) => {
      if (fwdReqErr) {
        return reject(fwdReqErr);
      }
      resolve(result);
    });
    return promise;
  }

  async handleSubscribe(clientSocket, request, response, cb) {
    let currentReqManager = await this.requestManager;

    // do the actual forward request to the node
    currentReqManager.send(request, (error, subscriptionId) => {
      if (error) {
        return cb(error);
      }
      // `result` contains our initial response from the node, ie
      // subscription id. Any FUTURE data from the node that needs
      // to be forwarded to the client connection will be handled
      // in the `.on('data')` event below.
      this.logger.debug(`Created subscription: ${subscriptionId} for ${JSON.stringify(request.params)}`);
      this.logger.debug(`Subscription request: ${JSON.stringify(request)} `);

      // Watch for `eth_subscribe` subscription data coming from the node.
      // Send the subscription data back across the originating client
      // connection.
      const onWsData = async (subscriptionResponse, deprecatedResponse) => {
        subscriptionResponse = subscriptionResponse || deprecatedResponse;

        // filter out any subscription data that is not meant to be passed back to the client
        // This is only needed when using a VM because the VM uses only one provider. When there is
        // only one provider, that single provider has 'data' events subscribed to it for each `eth_subscribe`.
        // When any subscription data is returned from the node, it will fire the 'data' event for ALL
        // `eth_subscribe`s. This filter prevents responding to sockets unnecessarily.
        if (!subscriptionResponse.params || subscriptionResponse.params.subscription !== subscriptionId) {
          return;
        }

        this.logger.debug(`Subscription data received from node and forwarded to originating socket client connection: ${JSON.stringify(subscriptionResponse)} `);

        // allow modification of the node subscription data sent to the client
        subscriptionResponse = await this.emitActionsForResponse({request: subscriptionResponse}, subscriptionResponse, clientSocket);
        this.respondWs(clientSocket, subscriptionResponse.response);
      };

      // when the node sends subscription message, we can forward that to originating socket
      currentReqManager.provider.on('data', onWsData);
      // kill WS connection to the node when the client connection closes
      clientSocket.on('close', () => currentReqManager.provider.removeListener('data', onWsData));

      // send a response to the original requesting inbound client socket
      // (ie the browser or embark) with the result of the subscription
      // request from the node
      response.result = subscriptionId;
      cb(null, response);
    });


  }

  async handleUnsubscribe(request, response, cb) {
    const currentReqManager = await this.requestManager;

    // forward unsubscription request to the node
    currentReqManager.send(request, (error, result) => {
      if (error) {
        return cb(error);
      }
      // `result` contains 'true' if the unsubscription request was successful
      this.logger.debug(`Unsubscription result for subscription '${JSON.stringify(request.params)}': ${result} `);
      this.logger.debug(`Unsubscription request: ${JSON.stringify(request)} `);

      // result should be true/false
      response.result = result;

      cb(null, response);
    });
  }

  respondWs(ws, response) {
    if (typeof response === "object") {
      response = JSON.stringify(response);
    }
    if (ws.readyState === ws.OPEN) {
      return ws.send(response);
    }
    const stateMap = {
      0: "connecting",
      1: "open",
      2: "closing",
      3: "closed"
    };
    this.logger.warn(`[Proxy]: Failed to send WebSocket response because the socket is ${stateMap[ws.readyState]}.Response: ${response} `);
  }
  respondHttp(res, statusCode, response) {
    res.status(statusCode).send(response);
  }

  respondError(transport, error) {
    return this.isWs ? this.respondWs(transport, error) : this.respondHttp(transport, 500, error);
  }

  respondOK(transport, response) {
    return this.isWs ? this.respondWs(transport, response) : this.respondHttp(transport, 200, response);
  }

  emitActionsForRequest(request, transport) {
    return new Promise((resolve, reject) => {
      let calledBack = false;
      const data = { request, isWs: this.isWs, transport };
      setTimeout(() => {
        if (calledBack) {
          return;
        }
        this.logger.warn(__('Action for request "%s" timed out', request.method));
        this.logger.debug(request);
        calledBack = true;
        resolve(data);
      }, ACTION_TIMEOUT);

      this.plugins.emitAndRunActionsForEvent('blockchain:proxy:request',
        data,
        (err, result) => {
          if (calledBack) {
            // Action timed out
            return;
          }
          if (err) {
            this.logger.error(__('Error parsing the request in the proxy'));
            this.logger.error(err);
            // Reset the data to the original request so that it can be used anyway
            calledBack = true;
            return reject(err);
          }
          calledBack = true;
          resolve(result);
        });
    });
  }

  emitActionsForResponse({originalRequest, request}, response, transport) {
    return new Promise((resolve, reject) => {
      const data = { originalRequest, request, response, isWs: this.isWs, transport };
      let calledBack = false;
      setTimeout(() => {
        if (calledBack) {
          return;
        }
        this.logger.warn(__('Action for response "%s" timed out', request.method));
        this.logger.debug(request);
        this.logger.debug(response);
        calledBack = true;
        resolve(data);
      }, ACTION_TIMEOUT);

      this.plugins.emitAndRunActionsForEvent('blockchain:proxy:response',
        data,
        (err, result) => {
          if (calledBack) {
            // Action timed out
            return;
          }
          if (err) {
            this.logger.error(__('Error parsing the response in the proxy'));
            this.logger.error(err);
            calledBack = true;
            // Reset the data to the original response so that it can be used anyway
            return reject(err);
          }
          calledBack = true;
          resolve(result);
        });
    });
  }

  stop() {
    if (!this.server) {
      return;
    }
    this.server.close();
    this.server = null;
    this.app = null;
    this.transactions = {};
  }
}
