/* global Buffer exports require */
import {__} from 'embark-i18n';
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
    this.server = null;
  }

  async serve(endpoint, localHost, localPort, ws) {
    if (endpoint === constants.blockchain.vm) {
      endpoint = this.vms[this.vms.length - 1]();
    }
    const requestManager = new Web3RequestManager.Manager(endpoint);

    try {
      await requestManager.send({method: 'eth_accounts'});
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
      this.app.ws('/', (ws, _wsReq) => {
        ws.on('message', (msg) => {
          let jsonMsg;
          try {
            jsonMsg = JSON.parse(msg);
          } catch (e) {
            this.logger.error(__('Error parsing request'), e.message);
            return;
          }
          // Modify request
          this.emitActionsForRequest(jsonMsg, (_err, resp) => {
            // Send the possibly modified request to the Node
            requestManager.send(resp.reqData, (err, result) => {
              if (err) {
                this.logger.debug(JSON.stringify(resp.reqData));
                return this.logger.error(__('Error executing the request on the Node'), err.message || err);
              }
              this.emitActionsForResponse(resp.reqData, {jsonrpc: "2.0", id: resp.reqData.id, result}, (_err, resp) => {
                // Send back to the caller (web3)
                ws.send(JSON.stringify(resp.respData));
              });
            });
          });
        });
      });
    } else {
      // HTTP
      this.app.use((req, res) => {
        // Modify request
        this.emitActionsForRequest(req.body, (_err, resp) => {
          // Send the possibly modified request to the Node
          requestManager.send(resp.reqData, (err, result) => {
            if (err) {
              return res.status(500).send(err.message || err);
            }
            this.emitActionsForResponse(resp.reqData, {jsonrpc: "2.0", id: resp.reqData.id, result}, (_err, resp) => {
              // Send back to the caller (web3)
              res.status(200).send(resp.respData);
            });
          });
        });
      });
    }

    return new Promise(resolve => {
      this.server = this.app.listen(localPort, localHost, null,
        () => {
          resolve(this.app);
        });
    });
  }

  emitActionsForRequest(body, cb) {
    let calledBack = false;
    setTimeout(() => {
      if (calledBack) {
        return;
      }
      this.logger.warn(__('Action for request "%s" timed out', body.method));
      this.logger.debug(body);
      cb(null, {reqData: body});
      calledBack = true;
    }, ACTION_TIMEOUT);

    this.plugins.emitAndRunActionsForEvent('blockchain:proxy:request',
      {reqData: body},
      (err, resp) => {
        if (err) {
          this.logger.error(__('Error parsing the request in the proxy'));
          this.logger.error(err);
          // Reset the data to the original request so that it can be used anyway
          resp = {reqData: body};
        }
        if (calledBack) {
          // Action timed out
          return;
        }
        cb(null, resp);
        calledBack = true;
      });
  }

  emitActionsForResponse(reqData, respData, cb) {
    let calledBack = false;
    setTimeout(() => {
      if (calledBack) {
        return;
      }
      this.logger.warn(__('Action for request "%s" timed out', reqData.method));
      this.logger.debug(reqData);
      this.logger.debug(respData);
      cb(null, {respData});
      calledBack = true;
    }, ACTION_TIMEOUT);

    this.plugins.emitAndRunActionsForEvent('blockchain:proxy:response',
      {respData, reqData},
      (err, resp) => {
        if (err) {
          this.logger.error(__('Error parsing the response in the proxy'));
          this.logger.error(err);
          // Reset the data to the original response so that it can be used anyway
          resp = {respData};
        }
        if (calledBack) {
          // Action timed out
          return;
        }
        cb(null, resp);
        calledBack = true;
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
