EmbarkJS.Messages.Whisper = {};

EmbarkJS.Messages.Whisper.sendMessage = function(options) {
  var topics, data, ttl, priority, payload;
  if (EmbarkJS.Messages.isNewWeb3()) {
    topics = options.topic || options.topics;
    data = options.data || options.payload;
    ttl = options.ttl || 100;
    priority = options.priority || 1000;
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
  } else {
    topics = options.topic || options.topics;
    data = options.data || options.payload;
    ttl = options.ttl || 100;
    priority = options.priority || 1000;
    var identity = options.identity || this.identity || web3.shh.newIdentity();
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

    return EmbarkJS.Messages.currentMessages.web3.shh.post(message, function() { });
  }
};

EmbarkJS.Messages.Whisper.listenTo = function(options) {
  var topics, _topics, messageEvents;
  if (EmbarkJS.Messages.isNewWeb3()) {
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
    _topics = [];

    let promise = new messageEvents();

    // listenTo
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
  } else {
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
  }
};
