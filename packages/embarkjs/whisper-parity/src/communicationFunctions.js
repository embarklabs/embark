const { fromEvent, merge, throwError } = require('rxjs');
const { map, mergeMap } = require('rxjs/operators');

function sendMessage(options, callback) {
  let topics = options.topic ? [options.topic] : [];
  const data = options.data;
  const ttl = options.ttl || 100;
  const powTime = options.powTime || 3;
  // const powTarget = options.powTarget || 0.5;
  // const sig = options.sig;
  // const fromAscii = options.fromAscii;
  // const toHex = options.toHex;
  // const symKeyID = options.symKeyID;
  const asymKeyID = options.asymKeyID;
  const post = options.post;

  // if (topics) {
  //   // TODO: determine if we need to limit to 10 topics
  //   topics = toHex(topics).slice(0, 10);
  // }

  let message = {
    // to: // Object The receiver of the message.Can be omitted for a broadcast message.Use one of the following two fields
    // {
    //   public: Data - 64 bytes - The public key of the recipient
    //   identity: Data - 32 bytes - The identity of the recipient key on your local node.
    // }
    "from": null, //asymKeyID, // Data - 32 bytes - asymmetric identity to sign the message with, or null.
    "topics": topics, // [Data] - Array of topics for the message.Should be non - empty.
    "payload": JSON.stringify(data), // Data - Message data
    // padding: // Data - Optional padding.Up to 2 ^ 24 - 1 bytes.
    "priority": powTime, // Quantity - How many milliseconds to spend doing PoW.
    "ttl": ttl // Quantity - Time to live(in seconds) of the message before expiry
  };

  // TODO: determine if we need to use keys other than the asymmetric key generated for us
  // if (options.pubKey) {
  //   message.pubKey = options.pubKey; // encrypt using a given pubKey
  // } else if (options.symKeyID) {
  //   message.symKeyID = options.symKeyID; // encrypts using given sym key ID
  // } else {
  //   message.symKeyID = symKeyID; // encrypts using the sym key ID
  // }

  // TODO: determine if we need these checks
  // if (topics === undefined && message.symKeyID && !message.pubKey) {
  //   callback("missing option: topic");
  // } else {
  post([message], callback);
  // }
}

function listenTo(options) {
  let topics = options.topic;
  const toAscii = options.toAscii;
  const toHex = options.toHex;
  // const sig = options.sig;
  const subscribe = options.subscribe;
  const asymKeyID = options.asymKeyID;
  // const symKeyID = options.symKeyID;

  // let subOptions = {};

  // TODO: determine if we need to limit to 10 topics
  if (topics) {
    if (typeof topics === 'string') {
      topics = [toHex(topics).slice(0, 10)];
    } else {
      topics = topics.map((t) => toHex(t).slice(0, 10));
    }
  }

  const filterRequest = {
    "decryptWith": null, // Data - 32 bytes - Identity of key used for description. null if listening for broadcasts.
    "from": null, // asymKeyID, // Data - 64 bytes - if present, only accept messages signed by this key.
    "topics": topics // [Data] - Only accept messages matching these topics. Should be non-empty.
  };

  // TODO: enable using private key. what does this do?
  // if (options.usePrivateKey === true) {
  //   filterRequest.decryptWith = options.privateKeyID || sig;
  // } else {
  //   subOptions.symKeyID = symKeyID;
  // }


  const emitter = subscribe('messages', filterRequest, (error, message, subscription) => {
    console.dir(error);
    console.dir(message);
    console.dir(subscription);
  });

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
