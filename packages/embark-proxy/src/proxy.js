/* global Buffer exports require */
import axios from "axios";

require('./httpProxyOverride');
const Asm = require('stream-json/Assembler');
import {canonicalHost, timer, pingEndpoint, deconstructUrl} from 'embark-utils';

const {parser: jsonParser} = require('stream-json');
const pump = require('pump');
const express = require('express');
const bodyParser = require('body-parser');

export class Proxy {
  constructor(ipc, events, plugins) {
    this.ipc = ipc;
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.toModifyPayloads = {};
    this.timeouts = {};
    this.events = events;
    this.plugins = plugins;
  }

  modifyPayload(toModifyPayloads, body) {
    // this.plugins.emitAndRunActionsForEvent('proxy:redponse:received', {body: body}, () => {
    //
    // })

    // switch (toModifyPayloads[body.id]) {
    //   case METHODS_TO_MODIFY.accounts:
    //     delete toModifyPayloads[body.id];
    //     body.result = Array.isArray(body.result) && body.result.concat(accounts);
    //     break;
    //   default:
    // }
    // return body;
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

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));


    app.use((req, res) => {
      axios.post(endpoint, req.body)
        .then((response) => {
          // handle success
          this.plugins.emitAndRunActionsForEvent('blockchain:proxy:response',
            {respData: response.data, reqData: req.body},
            (err, resp) => {
            res.send(resp.respData);
          });
        })
        .catch((error) => {
          res.status(500);
          res.send(error.message);
        });
    });

    return new Promise(resolve => {
      app.listen(localPort, localHost, null,
        () => {
          resolve(app);
        });
    });
  }
}
