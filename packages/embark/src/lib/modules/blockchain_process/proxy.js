/* global Buffer __ exports require */

require('./httpProxyOverride');
const Asm = require('stream-json/Assembler');
const {canonicalHost} = require('../../utils/host');
const constants = require('../../constants.json');
const {Duplex} = require('stream');
const http = require('http');
const httpProxy = require('http-proxy');
const {parser: jsonParser} = require('stream-json');
const pump = require('pump');
const utils = require('../../utils/utils');
const WsParser = require('simples/lib/parsers/ws');
const WsWrapper = require('simples/lib/ws/wrapper');
const modifyResponse = require('node-http-proxy-json');
const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

const METHODS_TO_MODIFY = {accounts: 'eth_accounts'};

const modifyPayload = (toModifyPayloads, body, accounts) => {
  switch (toModifyPayloads[body.id]) {
    case METHODS_TO_MODIFY.accounts:
      delete toModifyPayloads[body.id];
      body.result = Array.isArray(body.result) && body.result.concat(accounts);
      break;
    default:
  }
  return body;
};

const hex = (n) => {
  let _n = n.toString(16);
  return _n.length === 1 ? '0' + _n : _n;
};

const parseJsonMaybe = (string) => {
  let object;
  // ignore empty strings
  if (string !== '') {
    try {
      object = JSON.parse(string);
    } catch(e) {
      // ignore client/server byte sequences sent when connections are closing
      if (Array.from(Buffer.from(string)).map(hex).join(':') !==
          '03:ef:bf:bd') {
        console.error(`Proxy: Error parsing string as JSON '${string}'`);
      }
    }
  }
  return object;
};

class Proxy {
  constructor(ipc) {
    this.ipc = ipc;
    this.commList = {};
    this.receipts = {};
    this.transactions = {};
    this.toModifyPayloads = {};
  }

  trackRequest(req) {
    if (!req) return;
    try {
      if (Object.values(METHODS_TO_MODIFY).includes(req.method)) {
        this.toModifyPayloads[req.id] = req.method;
      }
      if (req.method === constants.blockchain.transactionMethods.eth_sendTransaction) {
        this.commList[req.id] = {
          type: 'contract-log',
          address: req.params[0].to,
          data: req.params[0].data
        };
      } else if (req.method === constants.blockchain.transactionMethods.eth_sendRawTransaction) {
        const rawData = Buffer.from(ethUtil.stripHexPrefix(req.params[0]), 'hex');
        const tx = new Transaction(rawData, 'hex');
        this.commList[req.id] = {
          type: 'contract-log',
          address: '0x' + tx.to.toString('hex'),
          data: '0x' + tx.data.toString('hex')
        };
      } else if (req.method === constants.blockchain.transactionMethods.eth_getTransactionReceipt) {
        if (this.transactions[req.params[0]]) {
          this.transactions[req.params[0]].receiptId = req.id;
          this.receipts[req.id] = this.transactions[req.params[0]].commListId;
        }
      }
    } catch (e) {
      console.error(
        `Proxy: Error tracking request message '${JSON.stringify(req)}'`,
      );
    }
  }

  trackResponse(res) {
    if (!res) return;
    try {
      if (this.commList[res.id]) {
        this.commList[res.id].transactionHash = res.result;
        this.transactions[res.result] = {
          commListId: res.id
        };
      } else if (this.receipts[res.id] && res.result && res.result.blockNumber) {
        // TODO find out why commList[receipts[res.id]] is sometimes not defined
        if (!this.commList[this.receipts[res.id]]) {
          this.commList[this.receipts[res.id]] = {};
        }
        this.commList[this.receipts[res.id]].blockNumber = res.result.blockNumber;
        this.commList[this.receipts[res.id]].gasUsed = res.result.gasUsed;
        this.commList[this.receipts[res.id]].status = res.result.status;

        if (this.ipc.connected && !this.ipc.connecting) {
          this.ipc.request('log', this.commList[this.receipts[res.id]]);
        } else {
          const message = this.commList[this.receipts[res.id]];
          this.ipc.connecting = true;
          this.ipc.connect(() => {
            this.ipc.connecting = false;
            this.ipc.request('log', message);
          });
        }
        delete this.transactions[this.commList[this.receipts[res.id]].transactionHash];
        delete this.commList[this.receipts[res.id]];
        delete this.receipts[res.id];
      }
    } catch (e) {
      console.error(
        `Proxy: Error tracking response message '${JSON.stringify(res)}'`
      );
    }
  }

  async serve(host, port, ws, origin, accounts, certOptions={}) {
    const start = Date.now();
    await (function waitOnTarget() {
      return new Promise(resolve => {
        utils.pingEndpoint(
          canonicalHost(host),
          port,
          ws ? 'ws': false,
          'http',
          origin ? origin.split(',')[0] : undefined,
          (err) => {
            if (!err || (Date.now() - start > 10000)) {
              resolve();
            } else {
              utils.timer(250).then(waitOnTarget).then(resolve);
            }
          }
        );
      });
    }());

    let proxy = httpProxy.createProxyServer({
      ssl: certOptions,
      target: {
        host: canonicalHost(host),
        port: port
      },
      ws: ws,
      createWsServerTransformStream: (_req, _proxyReq, _proxyRes) => {
        const parser = new WsParser(0, true);
        parser.on('frame', ({data: buffer}) => {
          let object = parseJsonMaybe(buffer.toString());
          if (object) {
            object = modifyPayload(this.toModifyPayloads, object, accounts);
            // track the modified response
            this.trackResponse(object);
            // send the modified response
            WsWrapper.wrap(
              {connection: dupl, masked: 0},
              Buffer.from(JSON.stringify(object)),
              () => {}
            );
          }
        });
        const dupl = new Duplex({
          read(_size) {},
          write(chunk, encoding, callback) {
            parser.write(chunk);
            callback();
          }
        });
        return dupl;
      }
    });

    proxy.on('error', (err) => {
      console.error(
        __('Proxy: Error forwarding requests to blockchain/simulator'),
        err.message
      );
    });

    proxy.on('proxyRes', (proxyRes, req, res) => {
      modifyResponse(res, proxyRes, (body) => {
        if (body) {
          body = modifyPayload(this.toModifyPayloads, body, accounts);
          this.trackResponse(body);
        }
        return body;
      });
    });

    const server = http.createServer((req, res) => {
      if (req.method === 'POST') {
        // messages TO the target
        Asm.connectTo(
          pump(req, jsonParser())
        ).on('done', ({current: object}) => {
          this.trackRequest(object);
        });
      }

      if (!ws) {
        proxy.web(req, res);
      }
    });

    if (ws) {
      server.on('upgrade', (msg, socket, head) => {
        proxy.ws(msg, socket, head);
      });

      proxy.on('open', (_proxySocket) => { /* messages FROM the target */ });

      proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
        // messages TO the target
        pump(socket, new WsParser(0, false)).on('frame', ({data: buffer}) => {
          const object = parseJsonMaybe(buffer.toString());
          this.trackRequest(object);
        });
      });
    }

    return new Promise(resolve => {
      server.listen(
        port - constants.blockchain.servicePortOnProxy,
        host,
        () => { resolve(server); }
      );
    });
  }
}

module.exports = Proxy;
