/*global EmbarkJS, Web3 */

// for the old version of whisper and web3.js
let __embarkWhisperOld = {};

__embarkWhisperOld.setProvider = function(options) {
  const self = this;
  let provider;
  if (options === undefined) {
    provider = "localhost:8546";
  } else {
    provider = options.server + ':' + options.port;
  }
  self.web3 = new Web3(new Web3.providers.HttpProvider("http://" + provider));
  self.getWhisperVersion(function(err, version) {
    if (err) {
      console.log("whisper not available");
    } else if (version >= 5) {
      throw new Error("whisper 5 not supported with this version of web3.js");
    } else {
      self.identity = self.web3.shh.newIdentity();
    }
    self.whisperVersion = self.web3.version.whisper;
  });
};

__embarkWhisperOld.sendMessage = function(options) {
  var topics, data, ttl, priority, payload;
  topics = options.topic || options.topics;
  data = options.data || options.payload;
  ttl = options.ttl || 100;
  priority = options.priority || 1000;
  var identity = options.identity || this.identity || this.web3.shh.newIdentity();
  var _topics;

  if (topics === undefined) {
    throw new Error("missing option: topic");
  }

  if (data === undefined) {
    throw new Error("missing option: data");
  }

  if (typeof topics === 'string') {
    _topics = [EmbarkJS.Utils.fromAscii(topics)];
  } else {
    _topics = topics.map((t) => EmbarkJS.Utils.fromAscii(t));
  }
  topics = _topics;

  payload = JSON.stringify(data);

  var message;
  message = {
    from: identity,
    topics: topics,
    payload: EmbarkJS.Utils.fromAscii(payload),
    ttl: ttl,
    priority: priority
  };

  return this.web3.shh.post(message, function() { });
};

__embarkWhisperOld.listenTo = function(options) {
  var topics, _topics, messageEvents;
  topics = options.topic || options.topics;
  _topics = [];

  messageEvents = function() {
    this.cb = function() {};
  };

  messageEvents.prototype.then = function(cb) {
    this.cb = cb;
  };

  messageEvents.prototype.error = function(err) {
    return err;
  };

  messageEvents.prototype.stop = function() {
    this.filter.stopWatching();
  };

  if (typeof topics === 'string') {
    _topics = [topics];
  } else {
    _topics = topics.map((t) => EmbarkJS.Utils.fromAscii(t));
  }
  topics = _topics;

  var filterOptions = {
    topics: topics
  };

  let promise = new messageEvents();

  let filter = this.web3.shh.filter(filterOptions, function(err, result) {
    var payload = JSON.parse(EmbarkJS.Utils.toAscii(result.payload));
    var data;
    if (err) {
      promise.error(err);
    } else {
      data = {
        topic: topics,
        data: payload,
        from: result.from,
        time: (new Date(result.sent * 1000))
      };
      promise.cb(payload, data, result);
    }
  });

  promise.filter = filter;

  return promise;
};

__embarkWhisperOld.getWhisperVersion = function(cb) {
  this.web3.version.getWhisper(function(err, _res) {
    cb(err, self.web3.version.whisper);
  });
};

// for the whisper v5 and web3.js 1.0
let __embarkWhisperNewWeb3 = {};

__embarkWhisperNewWeb3.setProvider = function(options) {
  const self = this;
  let provider;
  if (options === undefined) {
    provider = "localhost:8546";
  } else {
    provider = options.server + ':' + options.port;
  }
  // TODO: take into account type
  self.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://" + provider));
  self.getWhisperVersion(function(err, version) {
    if (err) {
      console.log("whisper not available");
    } else if (version >= 5) {
        self.web3.shh.newSymKey().then((id) => { self.symKeyID = id; });
        self.web3.shh.newKeyPair().then((id) => { self.sig = id; });
    } else {
      throw new Error("version of whisper not supported");
    }
    self.whisperVersion = self.web3.version.whisper;
  });
};

__embarkWhisperNewWeb3.sendMessage = function(options) {
  var topics, data, ttl, payload;
  topics = options.topic || options.topics;
  data = options.data || options.payload;
  ttl = options.ttl || 100;
  var powTime = options.powTime || 3;
  var powTarget = options.powTarget || 0.5;

  if (topics === undefined) {
    throw new Error("missing option: topic");
  }

  if (data === undefined) {
    throw new Error("missing option: data");
  }

  topics = this.web3.utils.toHex(topics).slice(0, 10);

  payload = JSON.stringify(data);

  let message = {
    symKeyID: this.symKeyID, // encrypts using the sym key ID
    sig: this.sig, // signs the message using the keyPair ID
    ttl: ttl,
    topic: topics,
    payload: EmbarkJS.Utils.fromAscii(payload),
    powTime: powTime,
    powTarget: powTarget
  };

  this.web3.shh.post(message, function() { });
};

__embarkWhisperNewWeb3.listenTo = function(options) {
  var topics, messageEvents;
  messageEvents = function() {
    this.cb = function() {};
  };

  messageEvents.prototype.then = function(cb) {
    this.cb = cb;
  };

  messageEvents.prototype.error = function(err) {
    return err;
  };

  messageEvents.prototype.stop = function() {
    this.filter.stopWatching();
  };

  topics = options.topic || options.topics;

  let promise = new messageEvents();

  if (typeof topics === 'string') {
    topics = [this.web3.utils.toHex(topics).slice(0, 10)];
  } else {
    topics = topics.map((t) => this.web3.utils.toHex(t).slice(0, 10));
  }

  let filter = this.web3.shh.subscribe("messages", {
    symKeyID: this.symKeyID,
    topics: topics
  }).on('data', function(result) {
    var payload = JSON.parse(EmbarkJS.Utils.toAscii(result.payload));
    var data;
    data = {
      topic: result.topic,
      data: payload,
      //from: result.from,
      time: result.timestamp
    };

    promise.cb(payload, data, result);
  });

  promise.filter = filter;

  return promise;
};

__embarkWhisperNewWeb3.getWhisperVersion = function(cb) {
  this.web3.shh.getVersion(function(err, version) {
    cb(err, version);
  });
};

if (EmbarkJS.isNewWeb3()) {
  EmbarkJS.Messages.registerProvider('whisper', __embarkWhisperNewWeb3);
} else {
  EmbarkJS.Messages.registerProvider('whisper', __embarkWhisperOld);
}

