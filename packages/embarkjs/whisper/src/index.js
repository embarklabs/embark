let Web3 = require('web3');
let { Manager } = require('web3-core-requestmanager');

const {sendMessage, listenTo} = require('./communicationFunctions').default;

// for the whisper v5 and web3.js 1.x
let __embarkWhisperNewWeb3 = {};

__embarkWhisperNewWeb3.real_sendMessage = sendMessage;
__embarkWhisperNewWeb3.real_listenTo = listenTo;

__embarkWhisperNewWeb3.setProvider = function(options) {
  const self = this;
  let endpoint;
  if (options === undefined) {
    endpoint = "localhost:8546";
  } else {
    endpoint = options.server + ':' + options.port;
  }
  // TODO: take into account type
  const provider = new Web3.providers.WebsocketProvider("ws://" + endpoint, options.providerOptions);

  self.web3 = new Web3(provider);
  self.requestManager = new Manager(provider);

  self.web3.currentProvider.on('connect', () => {
    self.getWhisperVersion(function(err, version) {
      if (err) {
        console.log("whisper not available");
      } else if (version >= 5) {
        self.web3.shh.newSymKey().then((id) => {
          self.symKeyID = id;
        });
        self.web3.shh.newKeyPair().then((id) => {
          self.sig = id;
        });
      } else {
        throw new Error("version of whisper not supported");
      }
      self.whisperVersion = self.web3.version.whisper;
    });
  });
  self.web3.currentProvider.on('error', () => {
    console.log("whisper not available");
  });
};

__embarkWhisperNewWeb3.sendMessage = function(options) {
  const data = options.data || options.payload;
  if (!data) {
    throw new Error("missing option: data");
  }
  Object.assign(options, {
    sig: this.sig,
    fromAscii: this.web3.utils.fromAscii,
    toHex: this.web3.utils.toHex,
    symKeyID: options.symKeyID || this.symKeyID,
    post: this.web3.shh.post,
    data
  });

  return this.real_sendMessage(options);
};

__embarkWhisperNewWeb3.listenTo = function (options) {
  Object.assign(options, {
    toAscii: this.web3.utils.toAscii,
    toHex: this.web3.utils.toHex,
    sig: this.sig,
    subscribe: this.web3.shh.subscribe,
    symKeyID: options.symKeyID || this.symKeyID
  });
  return this.real_listenTo(options);
};

__embarkWhisperNewWeb3.getWhisperVersion = function(cb) {
  // 1) Parity does not implement shh_version JSON-RPC method
  // 2) web3 1.0 still does not implement web3_clientVersion
  // so we must do all by our own
  const self = this;
  self.requestManager.send({method: 'web3_clientVersion', params: []}, (err, clientVersion) => {
    if (err) return cb(err);
    if (clientVersion.indexOf("Parity-Ethereum//v2") === 0) {
      // This is Parity
      self.web3.shh.getInfo(function(err) {
        if (err) {
          return cb(err, 0);
        }
        // TOFIX Assume Whisper v6 until there's a way to understand it via JSON-RPC
        return cb(err, 6);
      });
    } else {
      // Assume it is a Geth compliant client
      self.web3.shh.getVersion(function(err, version) {
        cb(err, version);
      });
    }
  });
};

__embarkWhisperNewWeb3.isAvailable = function() {
  return new Promise((resolve, reject) => {
    if (!this.web3.shh) {
      return resolve(false);
    }
    try {
      this.getWhisperVersion((err) => {
        resolve(Boolean(!err));
      });
    }
    catch (err) {
      reject(err);
    }
  });
};

export default __embarkWhisperNewWeb3;
