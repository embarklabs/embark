/* global Buffer exports require */
import {__} from 'embark-i18n';
import axios from "axios";
import {canonicalHost, timer, pingEndpoint, deconstructUrl} from 'embark-utils';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
const WebSocket = require("ws");

const ACTION_TIMEOUT = 5000;

export class Proxy {
  constructor(options) {
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.timeouts = {};
    this.events = options.events;
    this.plugins = options.plugins;
    this.logger = options.logger;
  }

  async serve(endpoint, localHost, localPort, ws, origin) {
    const start = Date.now();
    const {host, port} = deconstructUrl(endpoint);
    await (function waitOnTarget() {
      return new Promise(resolve => {
        pingEndpoint(
          canonicalHost(host),
          port,
          ws ? 'ws' : false,
          'http',
          origin ? origin.split(',')[0] : undefined,
          (err) => {
            if (!err || (Date.now() - start > 10000)) {
              resolve();
            } else {
              timer(250).then(waitOnTarget).then(resolve);
            }
          }
        );
      });
    }());

    const app = express();
    if (ws) {
      expressWs(app);
    }

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    if (ws) {
      const messages = {};
      const conn = new WebSocket(endpoint);
      conn.on("message", (data) => {
        // Message from the Node
        let jsonData;
        try {
          jsonData = JSON.parse(data);
        } catch (e) {
          this.logger.error(__('Error parsing response'), e.message);
          return;
        }
        const msg = messages[jsonData.id];
        if (!msg) {
          // Not a request
          return;
        }
        delete messages[jsonData.id];
        // Send to plugins to possibly modify the response
        this.emitActionsForResponse(msg.msg, jsonData, (_err, resp) => {
            // Send back to the caller (web3)
            msg.ws.send(JSON.stringify(resp.respData));
          });
      });
      conn.on("error", (e) => {
        this.logger.error(__('Error executing the request on the Node'), JSON.stringify(e));
      });

      app.ws('/', (ws, _wsReq) => {
        ws.on('message', (msg) => {
          let jsonMsg;
          try {
            jsonMsg = JSON.parse(msg);
          } catch (e) {
            this.logger.error(__('Error parsing request'), e.message);
            return;
          }
          messages[jsonMsg.id] = {msg: jsonMsg, ws};
          // Modify request
          this.emitActionsForRequest(jsonMsg, (_err, resp) => {
              // Send the possibly modified request to the Node
              conn.send(JSON.stringify(resp.reqData));
            });
        });
      });
    } else {
      // HTTP
      app.use((req, res) => {
        // Modify request
       this.emitActionsForRequest(req.body, (_err, resp) => {
            // Send the possibly modified request to the Node
            axios.post(endpoint, resp.reqData)
              .then((response) => {
                // Send to plugins to possibly modify the response
                this.emitActionsForResponse(resp.reqData, response.data, (_err, resp) => {
                    // Send back to the caller (web3)
                    res.send(resp.respData);
                  });
              })
              .catch((error) => {
                res.status(500);
                res.send(error.message);
              });
          });
      });
    }

    return new Promise(resolve => {
      app.listen(localPort, localHost, null,
        () => {
          resolve(app);
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
}
