const utils = require("../../utils/utils.js");
const fs = require("../../core/fs.js");
const Web3 = require("web3");
const {parallel} = require("async");
const {sendMessage, listenTo} = require("./js/communicationFunctions");
const messageEvents = require("./js/message_events");
// @ts-ignore
const constants = require("../../constants");

const {canonicalHost, defaultHost} = require("../../utils/host");

class Whisper {
  private logger: any;
  private events: any;
  private communicationConfig: any;
  private web3: any;
  private embark: any;
  private web3Ready: any;
  private isOldWeb3: any;
  private apiCallsRegistered: any;
  private webSocketsChannels: any;

  constructor(embark: any, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.communicationConfig = embark.config.communicationConfig;
    this.web3 = new Web3();
    this.embark = embark;
    this.web3Ready = false;

    if (embark.currentContext.includes("test") && options.node && options.node === "vm") {
      this.logger.info(__("Whisper disabled in the tests"));
      return;
    }

    if (!this.communicationConfig.enabled) {
      return;
    }

    this.connectToProvider();

    this.events.request("processes:register", "whisper", (cb: any) => {
      this.waitForWeb3Ready(() => {
        this.web3.shh.getInfo((err: any) => {
          if (err) {
            const message = err.message || err;
            if (message.indexOf("not supported") > -1) {
              this.logger.error("Whisper is not supported on your node. Are you using the simulator?");
              return this.logger.trace(message);
            }
          }
          this.setServiceCheck();
          this.addWhisperToEmbarkJS();
          this.addSetProvider();
          this.registerAPICalls();
          cb();
        });
      });
    });

    this.events.request("processes:launch", "whisper");
  }

  private connectToProvider() {
    const {host, port} = this.communicationConfig.connection;
    const web3Endpoint = "ws://" + host + ":" + port;
    // Note: dont"t pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the followin error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
    this.web3.setProvider(new Web3.providers.WebsocketProvider(web3Endpoint, {headers: {Origin: constants.embarkResourceOrigin}}));
  }

  private waitForWeb3Ready(cb: any) {
    if (this.web3Ready) {
      return cb();
    }
    if (this.web3.currentProvider.connection.readyState !== 1) {
      this.connectToProvider();
      return setTimeout(this.waitForWeb3Ready.bind(this, cb), 50);
    }
    this.web3Ready = true;
    cb();
  }

  private setServiceCheck() {
    const self = this;
    self.events.request("services:register", "Whisper", (cb: any) => {
      if (!self.web3.currentProvider || self.web3.currentProvider.connection.readyState !== 1) {
        return self.connectToProvider();
      }
      // 1) Parity does not implement shh_version JSON-RPC method
      // 2) web3 1.0 still does not implement web3_clientVersion
      // so we must do all by our own
      self.web3._requestManager.send({method: "web3_clientVersion", params: []}, (versionError: any, clientVersion: any) => {
        if (versionError) {
          return cb(versionError);
        }
        if (clientVersion.indexOf("Parity-Ethereum//v2") === 0) {
          // This is Parity
          return self.web3.shh.getInfo((err: any) => {
            if (err) {
              return cb({name: "Whisper", status: "off"});
            }
            // TOFIX Assume Whisper v6 until there"s a way to understand it via JSON-RPC
            return cb({name: "Whisper (version 6)", status: "on"});
          });
        }
        // Assume it is a Geth compliant client
        self.web3.shh.getVersion((err: any, version: any) => {
          if (err || version === "2") {
            return cb({name: "Whisper", status: "off"});
          }
          return cb({name: "Whisper (version " + version + ")", status: "on"});
        });
      });
    });
  }

  private addWhisperToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.communicationConfig === {}) {
      return;
    }
    if ((this.communicationConfig.available_providers.indexOf("whisper") < 0) && (this.communicationConfig.provider !== "whisper" || this.communicationConfig.enabled !== true)) {
      return;
    }

    // TODO: possible race condition could be a concern
    this.events.request("version:get:web3", (web3Version: any) => {
      let code = "";
      code += "\n" + fs.readFileSync(utils.joinPath(__dirname, "js", "message_events.js")).toString();

      if (web3Version[0] === "0") {
        self.isOldWeb3 = true;
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, "js", "embarkjs_old_web3.js")).toString();
        code += "\nEmbarkJS.Messages.registerProvider('whisper', __embarkWhisperOld);";
      } else {
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, "js", "communicationFunctions.js")).toString();
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, "js", "embarkjs.js")).toString();
        code += "\nEmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3);";
      }
      self.embark.addCodeToEmbarkJS(code);
    });
  }

  private addSetProvider() {
    const connection = this.communicationConfig.connection || {};
    const shouldInit = (communicationConfig: any) => {
      return (communicationConfig.provider === "whisper" && communicationConfig.enabled === true);
    };

    // todo: make the add code a function as well
    const config = {
      port: connection.port || "8546",
      server: canonicalHost(connection.host || defaultHost),
      type: connection.type || "ws",
    };
    const code = `\nEmbarkJS.Messages.setProvider("whisper", ${JSON.stringify(config)});`;
    this.embark.addProviderInit("communication", code, shouldInit);

    const consoleConfig = Object.assign({}, config, {providerOptions: {headers: {Origin: constants.embarkResourceOrigin}}});
    const consoleCode = `\nEmbarkJS.Messages.setProvider("whisper", ${JSON.stringify(consoleConfig)});`;
    this.embark.addConsoleProviderInit("communication", consoleCode, shouldInit);
  }

  private registerAPICalls() {
    const self = this;
    if (self.apiCallsRegistered) {
      return;
    }
    self.apiCallsRegistered = true;
    let symKeyID: any;
    let sig: any;
    parallel([
      (paraCb: any) => {
        self.web3.shh.newSymKey((err: any, id: any) => {
          symKeyID = id;
          paraCb(err);
        });
      },
      (paraCb: any) => {
        self.web3.shh.newKeyPair((err: any, id: any) => {
          sig = id;
          paraCb(err);
        });
      },
    ], (err: any) => {
      if (err) {
        self.logger.error("Error getting Whisper keys:", err.message || err);
        return;
      }
      self.embark.registerAPICall(
        "post",
        "/embark-api/communication/sendMessage",
        (req: any, res: any) => {
          sendMessage({
            data: req.body.message,
            fromAscii: self.web3.utils.asciiToHex,
            post: self.web3.shh.post,
            sig,
            symKeyID,
            toHex: self.web3.utils.toHex,
            topic: req.body.topic,
          }, (reqErr: any, result: any) => {
            if (reqErr) {
              return res.status(500).send({error: reqErr});
            }
            res.send(result);
          });
        });

      self.embark.registerAPICall(
        "ws",
        "/embark-api/communication/listenTo/:topic",
        (ws: any, req: any) => {
          self.webSocketsChannels[req.params.topic] = listenTo({
            messageEvents,
            sig,
            subscribe: self.web3.shh.subscribe,
            symKeyID,
            toAscii: self.web3.utils.hexToAscii,
            toHex: self.web3.utils.toHex,
            topic: req.params.topic,
          }, (reqErr: any, result: any) => {
            if (ws.readyState === ws.CLOSED) {
              return;
            }
            if (reqErr) {
              return ws.status(500).send(JSON.stringify({error: reqErr}));
            }
            ws.send(JSON.stringify(result));
          });
        });
    });
  }
}

export default Whisper;
