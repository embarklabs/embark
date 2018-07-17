/*global EmbarkJS, Web3, __MessageEvents */

// for the whisper v5 and web3.js 1.0
let __embarkWhisperNewWeb3 = {};

__embarkWhisperNewWeb3.setProvider = function (options) {
  const self = this;
  let provider;
  if (options === undefined) {
    provider = "localhost:8546";
  } else {
    provider = options.server + ':' + options.port;
  }
  // TODO: take into account type
  self.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://" + provider));
  self.getWhisperVersion(function (err, version) {
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
};

__embarkWhisperNewWeb3.sendMessage = function (options) {
  var topics, data, ttl, payload;
  topics = options.topic;
  data = options.data || options.payload;
  ttl = options.ttl || 100;
  var powTime = options.powTime || 3;
  var powTarget = options.powTarget || 0.5;

  if (data === undefined) {
    throw new Error("missing option: data");
  }

  if (topics) {
    topics = this.web3.utils.toHex(topics).slice(0, 10);
  }

  payload = JSON.stringify(data);

  let message = {
    sig: this.sig, // signs the message using the keyPair ID
    ttl: ttl,
    payload: EmbarkJS.Utils.fromAscii(payload),
    powTime: powTime,
    powTarget: powTarget
  };

  if (topics) {
    message.topic = topics;
  }

  if (options.pubKey) {
    message.pubKey = options.pubKey; // encrypt using a given pubKey
  } else if(options.symKeyID) {
    message.symKeyID = options.symKeyID; // encrypts using given sym key ID
  } else {
    message.symKeyID = this.symKeyID; // encrypts using the sym key ID
  }

  if (topics === undefined && message.symKeyID && !message.pubKey) {
    throw new Error("missing option: topic");
  }

  this.web3.shh.post(message, function () {
  });
};

__embarkWhisperNewWeb3.listenTo = function (options, callback) {
  var topics = options.topic;

  let promise = new __MessageEvents();

  let subOptions = {};

  if(topics){
    if (typeof topics === 'string') {
      topics = [this.web3.utils.toHex(topics).slice(0, 10)];
    } else {
      topics = topics.map((t) => this.web3.utils.toHex(t).slice(0, 10));
    }
    subOptions.topics = topics;
  }

  if (options.minPow) {
    subOptions.minPow = options.minPow;
  }

  if (options.usePrivateKey === true) {
    if (options.privateKeyID) {
      subOptions.privateKeyID = options.privateKeyID;
    } else {
      subOptions.privateKeyID = this.sig;
    }
  } else {
    if (options.symKeyID) {
      subOptions.symKeyID = options.symKeyID;
    } else {
      subOptions.symKeyID = this.symKeyID;
    }
  }

  let filter = this.web3.shh.subscribe("messages", subOptions)
  .on('data', function (result) {
    var payload = JSON.parse(EmbarkJS.Utils.toAscii(result.payload));
    var data;
    data = {
      topic: EmbarkJS.Utils.toAscii(result.topic),
      data: payload,
      //from: result.from,
      time: result.timestamp
    };

    if (callback) {
      return callback(null, data);
    }
    promise.cb(payload, data, result);
  });

  promise.filter = filter;

  return promise;
};

__embarkWhisperNewWeb3.getWhisperVersion = function (cb) {
  this.web3.shh.getVersion(function (err, version) {
    cb(err, version);
  });
};

__embarkWhisperNewWeb3.isAvailable = function () {
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

