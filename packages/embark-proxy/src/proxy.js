/* global Buffer exports require */
import {__} from 'embark-i18n';
import axios from "axios";
import {canonicalHost, timer, pingEndpoint, deconstructUrl} from 'embark-utils';
import express from 'express';
import cors from 'cors';
import {rsort} from "semver";

export class Proxy {
  constructor(options) {
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.toModifyPayloads = {};
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

    app.use(cors())
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));


    app.use((req, res) => {
      // Modify request
      this.plugins.emitAndRunActionsForEvent('blockchain:proxy:request',
        {reqData: req.body},
        (err, resp) => {
          if (err) {
            this.logger.error(__('Error parsing the request in the proxy'));
            this.logger.error(err);
            // Reset the data to the original request so that it can be used anyway
            resp = {reqData: req.body};
          }

          // Send the possibly modified request to the Node
          axios.post(endpoint, resp.reqData)
            .then((response) => {

              // Send to plugins to possibly modify the response
              this.plugins.emitAndRunActionsForEvent('blockchain:proxy:response',
                {respData: response.data, reqData: req.body},
                (err, resp) => {
                  if (err) {
                    this.logger.error(__('Error parsing the response in the proxy'));
                    this.logger.error(err);
                    // Reset the data to the original response so that it can be used anyway
                    resp = {respData: response.data};
                  }
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

    return new Promise(resolve => {
      app.listen(localPort, localHost, null,
        () => {
          resolve(app);
        });
    });
  }
}
