var Promise = require('bluebird');
//var Ipfs = require('./ipfs.js');

var EmbarkJS = {
};

EmbarkJS.Contract = function(options) {
  var self = this;

  this.abi = options.abi;
  this.address = options.address;
  this.code = options.code;
  this.web3 = options.web3 || web3;

  var ContractClass = this.web3.eth.contract(this.abi);

  this._originalContractObject = ContractClass.at(this.address);
  this._methods = Object.getOwnPropertyNames(this._originalContractObject).filter(function (p) {
    // TODO: check for forbidden properties
    if (typeof self._originalContractObject[p] === 'function') {
      self[p] = Promise.promisify(self._originalContractObject[p]);
      return true;
    }
    return false;
  });
};

EmbarkJS.Contract.prototype.deploy = function(args) {
  var self = this;
  var contractParams;

  contractParams = args;

  contractParams.push({
    from: this.web3.eth.accounts[0],
    data: this.code,
    gas: 500000,
    gasPrice: 10000000000000
  });

  var contractObject = this.web3.eth.contract(this.abi);

  var promise = new Promise(function(resolve, reject) {
    contractParams.push(function(err, transaction) {
      console.log("callback");
      if (err) {
        console.log("error");
        reject(err);
      } else if (transaction.address !== undefined) {
        console.log("address contract: " + transaction.address);
        resolve(new EmbarkJS.Contract({abi: self.abi, code: self.code, address: transaction.address}));
      }
    });
    console.log(contractParams);

    // returns promise
    // deploys contract
    // wraps it around EmbarkJS.Contract
    contractObject["new"].apply(contractObject, contractParams);
  });

  
  return promise;
};

EmbarkJS.IPFS = 'ipfs';

EmbarkJS.Storage = {
};

// EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'})<F37>
//{server: ‘localhost’, port: ‘5001’};

EmbarkJS.Storage.setProvider = function(provider, options) {
  if (provider === 'ipfs') {
    this.currentStorage = EmbarkJS.Storage.IPFS;
    this.ipfsConnection = Ipfs(options.server, options.port);
  } else {
    throw Error('unknown provider');
  }
};

EmbarkJS.Storage.saveText = function(text) {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    self.ipfsConnection.add((new self.ipfsConnection.Buffer(text)), function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0].path);
      }
    });
  });

  return promise;
};

EmbarkJS.Storage.uploadFile = function(inputSelector) {
  var self = this;
  var file = inputSelector[0].files[0];

  var promise = new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onloadend = function() { 
      var fileContent = reader.result;
      var buffer = self.ipfsConnection.Buffer.from(fileContent);
      self.ipfsConnection.add(buffer, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].path);
        }
      });
    };
    reader.readAsArrayBuffer(file);
  });

  return promise;
};

EmbarkJS.Storage.get = function(hash) {
  var self = this;
  var ipfsHash = this.web3.toAscii(hash);

  var promise = new Promise(function(resolve, reject) {
    self.ipfsConnection.object.get([ipfsHash]).then(function(node) {
      resolve(node.data);
    });
  });

  return promise;
};

EmbarkJS.Storage.getUrl = function(hash) {
  var self = this;
  var ipfsHash = web3.toAscii(hash);

  return 'http://localhost:8080/ipfs/' + ipfsHash;
};

EmbarkJS.Messages = {
};

EmbarkJS.Messages.setProvider = function(provider) {
  if (provider === 'whisper') {
    this.currentMessages = EmbarkJS.Messages.Whisper;
  } else {
    throw Error('unknown provider');
  }
};

EmbarkJS.Messages.sendMessage = function(options) {
  return EmbarkJS.Messages.Whisper.sendMessage(options);
};

EmbarkJS.Messages.listenTo = function(options) {
  return EmbarkJS.Messages.Whisper.listenTo(options);
};

EmbarkJS.Messages.Whisper = {
};

EmbarkJS.Messages.Whisper.sendMessage = function(options) {
  var topics = options.topic || options.topics;
  var data = options.data || options.payload;
  var identity = options.identity || web3.shh.newIdentity();
  var ttl = options.ttl || 100;
  var priority = options.priority || 1000;

  if (topics === undefined) {
    throw new Error("missing option: topic");
  }

  if (data === undefined) {
    throw new Error("missing option: data");
  }

  // do fromAscii to each topics unless it's already a string
  if (typeof topics === 'string') {
    topics = topics;
  } else {
    // TODO: replace with es6 + babel;
    var _topics = [];
    for (var i = 0; i < topics.length; i++) {
      _topics.push(web3.fromAscii(topics[i]));
    }
    topics = _topics;
  }

  var payload = JSON.stringify(data);

  var message = {
    from: identity,
    topics: [web3.fromAscii(topics)],
    payload: web3.fromAscii(payload),
    ttl: ttl,
    priority: priority
  };

  return web3.shh.post(message);
};

EmbarkJS.Messages.Whisper.listenTo = function(options) {
  var topics = options.topic || options.topics;

  if (typeof topics === 'string') {
    topics = [topics];
  } else {
    // TODO: replace with es6 + babel;
    var _topics = [];
    for (var i = 0; i < topics.length; i++) {
      _topics.push(web3.fromAscii(topics[i]));
    }
    topics = _topics;
  }

  var filterOptions = {
    topics: topics
  };

  var multiplePromise = function() {
    this.cb = function() {};
  };

  multiplePromise.prototype.then = function(cb) {
    this.cb = cb;
  };

  multiplePromise.prototype.error = function(err) {
    return err;
  };

  var promise = new multiplePromise();

  var filter = web3.shh.filter(filterOptions, function(err, result) {
    var payload = JSON.parse(web3.toAscii(result.payload));
    if (err) {
      promise.error(err);
    } else {
      promise.cb(payload);
    }
  });

  return promise;
};

module.exports = EmbarkJS;
