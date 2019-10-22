/* global Buffer exports require */
import { __ } from 'embark-i18n';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
const Web3RequestManager = require('web3-core-requestmanager');
const constants = require("embark-core/constants");

const ACTION_TIMEOUT = 5000;

export class Proxy {
  constructor(options) {
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.timeouts = {};
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.vms = options.vms;
    this.app = null;
    this.endpoint = options.endpoint;
    if (options.endpoint === constants.blockchain.vm) {
      this.endpoint = this.vms[this.vms.length - 1]();
    }
    this.isWs = options.isWs;
    // used to service all non-long-living WS connections, including any
    // request that is not WS and any WS request that is not an `eth_subscribe`
    // RPC request
    this.requestManager = new Web3RequestManager.Manager(this.endpoint);
    this.nodeSubscriptions = {};
  }

  async nodeReady() {
    try {
      await this.requestManager.send({ method: 'eth_accounts' });
    } catch (e) {
      throw new Error(__(`Unable to connect to the blockchain endpoint on ${this.endpoint}`));
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

        conn.on('message', async (msg) => {
          try {
            const jsonMsg = JSON.parse(msg);
            await this.processRequest(jsonMsg, conn);
          }
          catch (err) {
            const error = __('Error processing request: %s', err.message);
            this.logger.error(error);
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
    const rpcRequest = request.method === "POST" ? request.body : request;
    try {
      modifiedRequest = await this.emitActionsForRequest(rpcRequest);
    }
    catch (reqError) {
      const error = reqError.message || reqError;
      this.logger.error(__(`Error executing request actions: ${error}`));
      // TODO: Change error code to be more specific. Codes in section 5.1 of the JSON-RPC spec: https://www.jsonrpc.org/specification
      const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": request.id };
      return this.respondError(transport, rpcErrorObj);
    }

    // Send the possibly modified request to the Node
    const respData = { jsonrpc: "2.0", id: modifiedRequest.reqData.id };
    if (modifiedRequest.sendToNode !== false) {

      // kill our manually created long-living connection for eth_subscribe if we have one
      if (this.isWs && modifiedRequest.reqData.method === 'eth_unsubscribe') {
        const id = modifiedRequest.reqData.params[0];
        this.nodeSubscriptions[id] && this.nodeSubscriptions[id].provider.disconnect();
      }
      // create a long-living WS connection to the node
      if (this.isWs && modifiedRequest.reqData.method === 'eth_subscribe') {

        // creates a new long-living connection to the node
        const currentReqManager = new Web3RequestManager.Manager(this.endpoint);

        // kill WS connetion to the node when the client connection closes
        transport.on('close', () => currentReqManager.provider.disconnect());

        // do the actual forward request to the node
        currentReqManager.send(modifiedRequest.reqData, (error, result) => {
          if (error) {
            const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedRequest.reqData.id };
            return this.respondError(transport, rpcErrorObj);
          }
          // `result` contains our initial response from the node, ie
          // subscription id. Any FUTURE data from the node that needs
          // to be forwarded to the client connection will be handled
          // in the `.on('data')` event below.
          this.logger.debug(`Created subscription: ${result}`);
          this.nodeSubscriptions[result] = currentReqManager;
          respData.result = result;
          // TODO: Kick off emitAcitonsForResponse here
          this.respondWs(transport, respData);
        });

        // Watch for `eth_subscribe` subscription data coming from the node.
        // Send the subscription data back across the originating client
        // connection.
        currentReqManager.provider.on('data', (result, deprecatedResult) => {
          result = result || deprecatedResult;
          this.logger.debug(`Subscription data received from node and forwarded to originating socket client connection: ${JSON.stringify(result)}`);
          // TODO: Kick off emitAcitonsForResponse here
          this.respondWs(transport, result);
        });

        return;
      }

      try {
        const result = await this.forwardRequestToNode(modifiedRequest.reqData);
        respData.result = result;
      } catch (fwdReqErr) {
        // The node responded with an error. Set up the error so that it can be
        // stripped out by modifying the response (via actions for blockchain:proxy:response)
        respData.error = fwdReqErr.message || fwdReqErr;
      }

      try {
        const modifiedResp = await this.emitActionsForResponse(modifiedRequest.reqData, respData);
        // Send back to the client
        if (modifiedResp && modifiedResp.respData && modifiedResp.respData.error) {
          // error returned from the node and it wasn't stripped by our response actions
          const error = modifiedResp.respData.error.message || modifiedResp.respData.error;
          this.logger.error(__(`Error returned from the node: ${error}`));
          const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedResp.respData.id };
          return this.respondError(transport, rpcErrorObj);
        }
        this.respondOK(transport, modifiedResp.respData);
      }
      catch (resError) {
        // if was an error in response actions (resError), send the error in the response
        const error = resError.message || resError;
        this.logger.error(__(`Error executing response actions: ${error}`));
        const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedRequest.reqData.id };
        return this.respondError(transport, rpcErrorObj);
      }
    }


  }

  forwardRequestToNode(reqData) {
    return new Promise((resolve, reject) => {
      this.requestManager.send(reqData, (fwdReqErr, result) => {
        if (fwdReqErr) {
          return reject(fwdReqErr);
        }
        resolve(result);
      });
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
    this.logger.warn(`[Proxy]: Failed to send WebSocket response because the socket is ${stateMap[ws.readyState]}. Response: ${response}`);
  }
  respondHttp(res, statusCode, response) {
    res.status(statusCode).send(response);
  }

  respondError(transport, error) {
    return this.isWs ? this.respondWs(transport, error) : this.respondHttp(transport, 500, error)
  }

  respondOK(transport, response) {
    return this.isWs ? this.respondWs(transport, response) : this.respondHttp(transport, 200, response)
  }

  emitActionsForRequest(body) {
    return new Promise((resolve, reject) => {
      let calledBack = false;
      setTimeout(() => {
        if (calledBack) {
          return;
        }
        this.logger.warn(__('Action for request "%s" timed out', body.method));
        this.logger.debug(body);
        calledBack = true;
        resolve({ reqData: body });
      }, ACTION_TIMEOUT);

      this.plugins.emitAndRunActionsForEvent('blockchain:proxy:request',
        { reqData: body },
        (err, resp) => {
          if (calledBack) {
            // Action timed out
            return;
          }
          if (err) {
            this.logger.error(__('Error parsing the request in the proxy'));
            this.logger.error(err);
            // Reset the data to the original request so that it can be used anyway
            resp = { reqData: body };
            calledBack = true;
            return reject(err);
          }
          calledBack = true;
          resolve(resp);
        });
    });
  }

  emitActionsForResponse(reqData, respData) {
    return new Promise((resolve, reject) => {
      let calledBack = false;
      setTimeout(() => {
        if (calledBack) {
          return;
        }
        this.logger.warn(__('Action for response "%s" timed out', reqData.method));
        this.logger.debug(reqData);
        this.logger.debug(respData);
        calledBack = true;
        resolve({ respData });
      }, ACTION_TIMEOUT);

      this.plugins.emitAndRunActionsForEvent('blockchain:proxy:response',
        { respData, reqData },
        (err, resp) => {
          if (calledBack) {
            // Action timed out
            return;
          }
          if (err) {
            this.logger.error(__('Error parsing the response in the proxy'));
            this.logger.error(err);
            calledBack = true;
            reject(err);
          }
          calledBack = true;
          resolve(resp);
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
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.timeouts = {};
  }
}
