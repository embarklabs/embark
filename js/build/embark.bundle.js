var EmbarkJS =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/*jshint esversion: 6 */
	//var Ipfs = require('./ipfs.js');

	var EmbarkJS = {
	};

	EmbarkJS.Contract = function(options) {
	  var self = this;
	  var i, abiElement;

	  this.abi = options.abi;
	  this.address = options.address;
	  this.code = '0x' + options.code;
	  this.web3 = options.web3 || web3;

	  var ContractClass = this.web3.eth.contract(this.abi);

	  this.eventList = [];

	  if (this.abi) {
	    for (i = 0; i < this.abi.length; i++) {
	      abiElement = this.abi[i];
	      if (abiElement.type === 'event') {
	        this.eventList.push(abiElement.name);
	      }
	    }
	  }

	  var messageEvents = function() {
	    this.cb = function() {};
	  };

	  messageEvents.prototype.then = function(cb) {
	    this.cb = cb;
	  };

	  messageEvents.prototype.error = function(err) {
	    return err;
	  };

	  this._originalContractObject = ContractClass.at(this.address);
	  this._methods = Object.getOwnPropertyNames(this._originalContractObject).filter(function (p) {
	    // TODO: check for forbidden properties
	    if (self.eventList.indexOf(p) >= 0) {

	      self[p] = function() {
	        var promise = new messageEvents();
	        var args = Array.prototype.slice.call(arguments);
	        args.push(function(err, result) {
	          if (err) {
	            promise.error(err);
	          } else {
	            promise.cb(result);
	          }
	        });

	        self._originalContractObject[p].apply(self._originalContractObject[p], args);
	        return promise;
	      };
	      return true;
	    } else if (typeof self._originalContractObject[p] === 'function') {
	      self[p] = function(_args) {
	        var args = Array.prototype.slice.call(arguments);
	        var fn = self._originalContractObject[p];
	        var props = self.abi.find((x) => x.name == p);

	        var promise = new Promise(function(resolve, reject) {
	          args.push(function(err, transaction) {
	            promise.tx = transaction;
	            if (err) {
	              return reject(err);
	            }

	            var getConfirmation = function() {
	              self.web3.eth.getTransactionReceipt(transaction, function(err, receipt) {
	                if (err) {
	                  return reject(err);
	                }

	                if (receipt !== null) {
	                  return resolve(receipt);
	                }

	                setTimeout(getConfirmation, 1000);
	              });
	            };

	            if (typeof(transaction) !== "string" || props.constant) {
	              resolve(transaction);
	            } else {
	              getConfirmation();
	            }
	          });

	          fn.apply(fn, args);
	        });

	        return promise;
	      };
	      return true;
	    }
	    return false;
	  });
	};

	EmbarkJS.Contract.prototype.deploy = function(args, _options) {
	  var self = this;
	  var contractParams;
	  var options = _options || {};

	  contractParams = args || [];

	  contractParams.push({
	    from: this.web3.eth.accounts[0],
	    data: this.code,
	    gas: options.gas || 800000
	  });

	  var contractObject = this.web3.eth.contract(this.abi);

	  var promise = new Promise(function(resolve, reject) {
	    contractParams.push(function(err, transaction) {
	      if (err) {
	        reject(err);
	      } else if (transaction.address !== undefined) {
	        resolve(new EmbarkJS.Contract({abi: self.abi, code: self.code, address: transaction.address}));
	      }
	    });

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

	EmbarkJS.Storage.setProvider = function(provider, options) {
	  if (provider === 'ipfs') {
	    this.currentStorage = EmbarkJS.Storage.IPFS;
	    if (options === undefined) {
	      this.ipfsConnection = IpfsApi('localhost', '5001');
	    } else {
	      this.ipfsConnection = IpfsApi(options.server, options.port);
	    }
	  } else {
	    throw Error('unknown provider');
	  }
	};

	EmbarkJS.Storage.saveText = function(text) {
	  var self = this;
	  if (!this.ipfsConnection) {
	    this.setProvider('ipfs');
	  }
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

	  if (file === undefined) {
	    throw new Error('no file found');
	  }

	  if (!this.ipfsConnection) {
	    this.setProvider('ipfs');
	  }

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
	  // TODO: detect type, then convert if needed
	  //var ipfsHash = web3.toAscii(hash);
	  if (!this.ipfsConnection) {
	    this.setProvider('ipfs');
	  }

	  var promise = new Promise(function(resolve, reject) {
	    self.ipfsConnection.object.get([hash]).then(function(node) {
	      resolve(node.data);
	    });
	  });

	  return promise;
	};

	EmbarkJS.Storage.getUrl = function(hash) {
	  //var ipfsHash = web3.toAscii(hash);

	  return 'http://localhost:8080/ipfs/' + hash;
	};

	EmbarkJS.Messages = {
	};

	EmbarkJS.Messages.setProvider = function(provider, options) {
	  var self = this;
	  var ipfs;
	  if (provider === 'whisper') {
	    this.currentMessages = EmbarkJS.Messages.Whisper;
	    if (typeof variable === 'undefined') {
	      if (options === undefined) {
	        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	      } else {
	        web3 = new Web3(new Web3.providers.HttpProvider("http://" + options.server + ':' + options.port));
	      }
	    }
	    web3.version.getWhisper(function(err, res) {
	      if (err) {
	        console.log("whisper not available");
	      } else {
	        self.currentMessages.identity = web3.shh.newIdentity();
	      }
	    });
	  } else if (provider === 'orbit') {
	    this.currentMessages = EmbarkJS.Messages.Orbit;
	    if (options === undefined) {
	      ipfs = HaadIpfsApi('localhost', '5001');
	    } else {
	      ipfs = HaadIpfsApi(options.server, options.port);
	    }
	    this.currentMessages.orbit = new Orbit(ipfs);
	    this.currentMessages.orbit.connect(web3.eth.accounts[0]);
	  } else {
	    throw Error('unknown provider');
	  }
	};

	EmbarkJS.Messages.sendMessage = function(options) {
	  return this.currentMessages.sendMessage(options);
	};

	EmbarkJS.Messages.listenTo = function(options) {
	  return this.currentMessages.listenTo(options);
	};

	EmbarkJS.Messages.Whisper = {
	};

	EmbarkJS.Messages.Whisper.sendMessage = function(options) {
	  var topics = options.topic || options.topics;
	  var data = options.data || options.payload;
	  var identity = options.identity || this.identity || web3.shh.newIdentity();
	  var ttl = options.ttl || 100;
	  var priority = options.priority || 1000;
	  var _topics;

	  if (topics === undefined) {
	    throw new Error("missing option: topic");
	  }

	  if (data === undefined) {
	    throw new Error("missing option: data");
	  }

	  // do fromAscii to each topics unless it's already a string
	  if (typeof topics === 'string') {
	    _topics = [web3.fromAscii(topics)];
	  } else {
	    // TODO: replace with es6 + babel;
	    for (var i = 0; i < topics.length; i++) {
	      _topics.push(web3.fromAscii(topics[i]));
	    }
	  }
	  topics = _topics;

	  var payload = JSON.stringify(data);

	  var message = {
	    from: identity,
	    topics: topics,
	    payload: web3.fromAscii(payload),
	    ttl: ttl,
	    priority: priority
	  };

	  return web3.shh.post(message, function() {});
	};

	EmbarkJS.Messages.Whisper.listenTo = function(options) {
	  var topics = options.topic || options.topics;
	  var _topics = [];

	  if (typeof topics === 'string') {
	    _topics = [topics];
	  } else {
	    // TODO: replace with es6 + babel;
	    for (var i = 0; i < topics.length; i++) {
	      _topics.push(topics[i]);
	    }
	  }
	  topics = _topics;

	  var filterOptions = {
	    topics: topics
	  };

	  var messageEvents = function() {
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

	  var promise = new messageEvents();

	  var filter = web3.shh.filter(filterOptions, function(err, result) {
	    var payload = JSON.parse(web3.toAscii(result.payload));
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

	EmbarkJS.Messages.Orbit = {
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

	module.exports = EmbarkJS;


/***/ }
/******/ ]);