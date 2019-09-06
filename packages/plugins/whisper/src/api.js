import {buildUrlFromConfig, canonicalHost, defaultHost} from 'embark-utils';
const {parallel} = require('async');
const {fromEvent} = require('rxjs');
const {map, takeUntil} = require('rxjs/operators');
const Web3 = require('web3');

import whisper from 'embarkjs-whisper';

const sendMessage = whisper.real_sendMessage;
const listenTo = whisper.real_listenTo;

class API {

  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.communicationConfig = embark.config.communicationConfig;

    embark.events.on("blockchain:started", this.registerAPICalls.bind(this));
  }

  async registerAPICalls() {
    const self = this;

    const connection = this.communicationConfig.connection || {};
    const config = {
      host: canonicalHost(connection.host || defaultHost),
      port: connection.port || '8546',
      type: connection.type || 'ws'
    };
    this.web3 = new Web3(buildUrlFromConfig(config));

    if (self.apiCallsRegistered) {
      return;
    }
    self.apiCallsRegistered = true;
    let symKeyID, sig;
    parallel([
      function(paraCb) {
        self.web3.shh.newSymKey((err, id) => {
          symKeyID = id;
          paraCb(err);
        });
      },
      function(paraCb) {
        self.web3.shh.newKeyPair((err, id) => {
          sig = id;
          paraCb(err);
        });
      }
    ], (err) => {
      if (err) {
        self.logger.error('Error getting Whisper keys:', err.message || err);
        return;
      }
      self.embark.registerAPICall(
        'post',
        '/embark-api/communication/sendMessage',
        (req, res) => {
          sendMessage({
            topic: req.body.topic,
            data: req.body.message,
            sig,
            symKeyID,
            fromAscii: self.web3.utils.asciiToHex,
            toHex: self.web3.utils.toHex,
            post: self.web3.shh.post
          }, (err, result) => {
            if (err) {
              return res.status(500).send({error: err});
            }
            res.send(result);
          });
        });

      self.embark.registerAPICall(
        'ws',
        '/embark-api/communication/listenTo/:topic',
        (ws, req) => {
          const obs = listenTo({
            toAscii: self.web3.utils.hexToAscii,
            toHex: self.web3.utils.toHex,
            topic: req.params.topic,
            sig,
            subscribe: self.web3.shh.subscribe,
            symKeyID
          }).pipe(takeUntil(fromEvent(ws, 'close').pipe(map(() => (
            delete self.webSocketsChannels[req.params.topic]
          )))));
          self.webSocketsChannels[req.params.topic] = obs;
          obs.subscribe(data => {
            ws.send(JSON.stringify(data));
          });
        });
    });
  }

}

module.exports = API;
