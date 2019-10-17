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
    this.requestManager;
  }

  async serve(endpoint, localHost, localPort, ws) {
    if (endpoint === constants.blockchain.vm) {
      endpoint = this.vms[this.vms.length - 1]();
    }
    this.requestManager = new Web3RequestManager.Manager(endpoint);

    try {
      await this.requestManager.send({ method: 'eth_accounts' });
    } catch (e) {
      throw new Error(__('Unable to connect to the blockchain endpoint'));
    }

    this.app = express();
    if (ws) {
      expressWs(this.app);
    }

    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({extended: true}));

    if (ws) {
      this.app.ws('/', async (ws, _wsReq) => {
        // Watch from subscription data for events
        this.requestManager.provider.on('data', function(result, deprecatedResult) {
          ws.send(JSON.stringify(result || deprecatedResult))
        });

        ws.on('message', async (msg) => {
          try {
            const jsonMsg = JSON.parse(msg);
            await this.processRequest(jsonMsg, ws, true);
          }
          catch (err) {
            const error = __('Error processing request: %s', err.message);
            this.logger.error(error);
            this.respondWs(ws, error);
          }
        });
      });
    } else {
      // HTTP
      this.app.use(async (req, res) => {
        // Modify request
        try {
          await this.processRequest(req, res, false);
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

  async processRequest(request, transport, isWs) {
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
      return this.respondError(transport, rpcErrorObj, isWs);
    }

    // Send the possibly modified request to the Node
    const respData = { jsonrpc: "2.0", id: modifiedRequest.reqData.id };
    if (modifiedRequest.sendToNode !== false) {
      try {
        const result = await this.forwardRequestToNode(modifiedRequest.reqData);
        respData.result = result;
      }
      catch (fwdReqErr) {
        // the node responded with an error. Set up the error so that it can be
        // stripped out by modifying the response (via actions for blockchain:proxy:response)
        respData.error = fwdReqErr.message || fwdReqErr;
      }
    }

    try {
      const modifiedResp = await this.emitActionsForResponse(modifiedRequest.reqData, respData);
      // Send back to the caller (web3)
      if (modifiedResp && modifiedResp.respData && modifiedResp.respData.error) {
        // error returned from the node and it wasn't stripped by our response actions
        const error = modifiedResp.respData.error.message || modifiedResp.respData.error;
        this.logger.error(__(`Error returned from the node: ${error}`));
        const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedResp.respData.id };
        return this.respondError(transport, rpcErrorObj, isWs);
      }
      this.respondOK(transport, modifiedResp.respData, isWs);
    }
    catch (resError) {
      // if was an error in response actions (resError), send the error in the response
      const error = resError.message || resError;
      this.logger.error(__(`Error executing response actions: ${error}`));
      const rpcErrorObj = { "jsonrpc": "2.0", "error": { "code": -32603, "message": error }, "id": modifiedRequest.reqData.id };
      return this.respondError(transport, rpcErrorObj, isWs);
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
    ws.send(response);
  }
  respondHttp(res, statusCode, response) {
    res.status(statusCode).send(response);
  }

  respondError(transport, error, isWs) {
    return isWs ? this.respondWs(transport, error) : this.respondHttp(transport, 500, error)
  }

  respondOK(transport, response, isWs) {
    return isWs ? this.respondWs(transport, response) : this.respondHttp(transport, 200, response)
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
