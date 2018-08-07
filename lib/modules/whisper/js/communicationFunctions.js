function sendMessage(options, callback) {
  let topics, ttl, payload;
  topics = options.topic;
  const data = options.data;
  ttl = options.ttl || 100;
  const powTime = options.powTime || 3;
  const powTarget = options.powTarget || 0.5;
  const sig = options.sig;
  const fromAscii = options.fromAscii;
  const toHex = options.toHex;
  const symKeyID = options.symKeyID;
  const post = options.post;

  if (topics) {
    topics = toHex(topics).slice(0, 10);
  }

  payload = JSON.stringify(data);

  let message = {
    sig: sig, // signs the message using the keyPair ID
    ttl: ttl,
    payload: fromAscii(payload),
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
    message.symKeyID = symKeyID; // encrypts using the sym key ID
  }

  if (topics === undefined && message.symKeyID && !message.pubKey) {
    return callback("missing option: topic");
  }

  post(message, callback);
}

function listenTo(options, callback) {
  let topics = options.topic;
  const messageEvents = options.messageEvents;
  const toHex = options.toHex;
  const toAscii = options.toAscii;
  const sig = options.sig;
  const symKeyID = options.symKeyID;
  const subscribe = options.subscribe;

  let promise = new messageEvents();

  let subOptions = {};

  if(topics){
    if (typeof topics === 'string') {
      topics = [toHex(topics).slice(0, 10)];
    } else {
      topics = topics.map((t) => toHex(t).slice(0, 10));
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
      subOptions.privateKeyID = sig;
    }
  } else {
    if (options.symKeyID) {
      subOptions.symKeyID = options.symKeyID;
    } else {
      subOptions.symKeyID = symKeyID;
    }
  }

  promise.filter = subscribe("messages", subOptions)
    .on('data', function (result) {
      var payload = JSON.parse(toAscii(result.payload));
      var data;
      data = {
        topic: toAscii(result.topic),
        data: payload,
        //from: result.from,
        time: result.timestamp
      };

      if (callback) {
        return callback(null, data);
      }
      promise.cb(payload, data, result);
    })
    .catch(callback);

  return promise;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendMessage,
    listenTo
  };
}
