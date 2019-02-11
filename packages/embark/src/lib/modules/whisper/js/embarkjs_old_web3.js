/* global EmbarkJS Web3 */

const {bindNodeCallback} = require('rxjs');
const {map} = require('rxjs/operators');

// for the old version of whisper and web3.js
let __embarkWhisperOld = {};

__embarkWhisperOld.setProvider = function (options) {
  const self = this;
  let provider;
  if (options === undefined) {
    provider = "localhost:8546";
  } else {
    provider = options.server + ':' + options.port;
  }
  self.web3 = new Web3(new Web3.providers.HttpProvider("http://" + provider));
  self.getWhisperVersion(function (err, version) {
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

__embarkWhisperOld.sendMessage = function (options) {
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

  return this.web3.shh.post(message, function () {
  });
};

__embarkWhisperOld.listenTo = function (options) {
  var topics, _topics;
  topics = options.topic || options.topics;
  _topics = [];

  if (typeof topics === 'string') {
    _topics = [topics];
  } else {
    _topics = topics.map((t) => EmbarkJS.Utils.fromAscii(t));
  }
  topics = _topics;

  var filterOptions = {
    topics: topics
  };

  const obsFilter = bindNodeCallback(this.web3.shh.filter);

  return obsFilter(filterOptions).pipe(map(result => ({
    data: JSON.parse(EmbarkJS.Utils.toAscii(result.payload)),
    from: result.from,
    payload: result.payload,
    result,
    time: (new Date(result.sent * 1000)),
    topic: topics
  })));
};

__embarkWhisperOld.getWhisperVersion = function (cb) {
  this.web3.version.getWhisper(function (err, _res) {
    cb(err, self.web3.version.whisper);
  });
};

__embarkWhisperOld.isAvailable = function () {
  return new Promise((resolve, reject) => {
    if (!this.web3) {
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
