EmbarkJS.Messages.Orbit = {};

EmbarkJS.Messages.Orbit.setProvider = function(options) {
  this.providerName = 'orbit';
  this.currentMessages = EmbarkJS.Messages.Orbit;
  if (options === undefined) {
    ipfs = HaadIpfsApi('localhost', '5001');
  } else {
    ipfs = HaadIpfsApi(options.host, options.port);
  }
  this.currentMessages.orbit = new Orbit(ipfs);
  if (typeof(web3) === "undefined") {
    this.currentMessages.orbit.connect(Math.random().toString(36).substring(2));
  } else {
    this.currentMessages.orbit.connect(web3.eth.accounts[0]);
  }
};

EmbarkJS.Messages.Orbit.sendMessage = function(options) {
    var topics = options.topic || options.topics;
    var data = options.data || options.payload;

    if (topics === undefined) {
        throw new Error("missing option: topic");
    }

    if (data === undefined) {
        throw new Error("missing option: data");
    }

    if (typeof topics === 'string') {
        topics = topics;
    } else {
        // TODO: better to just send to different channels instead
        topics = topics.join(',');
    }

    this.orbit.join(topics);

    var payload = JSON.stringify(data);

    this.orbit.send(topics, data);
};

EmbarkJS.Messages.Orbit.listenTo = function(options) {
    var self = this;
    var topics = options.topic || options.topics;

    if (typeof topics === 'string') {
        topics = topics;
    } else {
        topics = topics.join(',');
    }

    this.orbit.join(topics);

    var messageEvents = function() {
        this.cb = function() {};
    };

    messageEvents.prototype.then = function(cb) {
        this.cb = cb;
    };

    messageEvents.prototype.error = function(err) {
        return err;
    };

    var promise = new messageEvents();

    this.orbit.events.on('message', (channel, message) => {
        // TODO: looks like sometimes it's receving messages from all topics
        if (topics !== channel) return;
        self.orbit.getPost(message.payload.value, true).then((post) => {
            var data = {
                topic: channel,
                data: post.content,
                from: post.meta.from.name,
                time: (new Date(post.meta.ts))
            };
            promise.cb(post.content, data, post);
        });
    });

    return promise;
};

// TODO: needs a real check for availability
// TODO: not tested as orbit is not loaded and therefore the provider is not available
EmbarkJS.Messages.Orbit.isAvailable = function(){
    return new Promise((resolve) => {
        if(!this.orbit) resolve(false);
        resolve(true);
    });
}