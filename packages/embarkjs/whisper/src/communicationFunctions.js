const {fromEvent, merge, throwError} = require('rxjs');
const {map, mergeMap} = require('rxjs/operators');

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
  } else if (options.symKeyID) {
    message.symKeyID = options.symKeyID; // encrypts using given sym key ID
  } else {
    message.symKeyID = symKeyID; // encrypts using the sym key ID
  }

  if (topics === undefined && message.symKeyID && !message.pubKey) {
    callback("missing option: topic");
  } else {
    post(message, callback);
  }
}

function listenTo(options) {
  let topics = options.topic;
  const toAscii = options.toAscii;
  const toHex = options.toHex;
  const sig = options.sig;
  const subscribe = options.subscribe;
  const symKeyID = options.symKeyID;

  let subOptions = {};

  if (topics) {
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
    subOptions.privateKeyID = options.privateKeyID || sig;
  } else {
    subOptions.symKeyID = symKeyID;
  }

  const emitter = subscribe('messages', subOptions);

  const obsData = fromEvent(emitter, 'data').pipe(map(result => ({
    data: JSON.parse(toAscii(result.payload)),
    payload: result.payload,
    recipientPublicKey: result.recipientPublicKey,
    result,
    sig: result.sig,
    time: result.timestamp,
    topic: toAscii(result.topic)
  })));

  const obsErr = fromEvent(emitter, 'error').pipe(mergeMap(throwError));

  const obsSub = merge(obsData, obsErr);
  obsSub.shhSubscription = emitter;

  return obsSub;
}

export default {
  sendMessage,
  listenTo
};
