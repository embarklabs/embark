(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["EmbarkJS"] = factory();
	else
		root["EmbarkJS"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/*jshint esversion: 6 */
//var Ipfs = require('./ipfs.js');

//=========================================================
// Embark Smart Contracts
//=========================================================

var EmbarkJS = {};

EmbarkJS.isNewWeb3 = function() {
  var _web3 = new Web3();
  if (typeof(_web3.version) === "string") {
    return true;
  }
  return parseInt(_web3.version.api.split('.')[0], 10) >= 1;
};

EmbarkJS.Contract = function(options) {
    var self = this;
    var i, abiElement;
    var ContractClass;

    this.abi = options.abi;
    this.address = options.address;
    this.code = '0x' + options.code;
    this.web3 = options.web3 || web3;

    if (EmbarkJS.isNewWeb3()) {
      // TODO:
      // add default **from** address
      // add gasPrice
      ContractClass = new this.web3.eth.Contract(this.abi, this.address);
      ContractClass.setProvider(this.web3.currentProvider);

      return ContractClass;
    } else {
      ContractClass = this.web3.eth.contract(this.abi);

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
      this._methods = Object.getOwnPropertyNames(this._originalContractObject).filter(function(p) {
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
    }
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
                resolve(new EmbarkJS.Contract({
                    abi: self.abi,
                    code: self.code,
                    address: transaction.address
                }));
            }
        });

        // returns promise
        // deploys contract
        // wraps it around EmbarkJS.Contract
        contractObject["new"].apply(contractObject, contractParams);
    });


    return promise;
};

EmbarkJS.Contract.prototype.new = EmbarkJS.Contract.prototype.deploy;

EmbarkJS.Contract.prototype.at = function(address) {
  return new EmbarkJS.Contract({ abi: this.abi, code: this.code, address: address });
};

EmbarkJS.Contract.prototype.send = function(value, unit, _options) {
  var options, wei;
  if (typeof unit === 'object') {
    options = unit;
    wei = value;
  } else {
    options = _options || {};
    wei = this.web3.toWei(value, unit);
  }

  options.to = this.address;
  options.value = wei;
  console.log(options);

  this.web3.eth.sendTransaction(options);
};

//=========================================================
// Embark Storage
//=========================================================

EmbarkJS.Storage = {};

EmbarkJS.Storage.Providers = {
    IPFS: 'ipfs',
    SWARM: 'swarm'
};

EmbarkJS.Storage.IPFS = {};

EmbarkJS.Storage.saveText = function(text) {
    return this.currentStorage.saveText(text);
};

EmbarkJS.Storage.get = function(hash) {
    return this.currentStorage.get(hash);
};

EmbarkJS.Storage.uploadFile = function(inputSelector) {
    return this.currentStorage.uploadFile(inputSelector);
};

EmbarkJS.Storage.getUrl = function(hash) {
    return this.currentStorage.getUrl(hash);
};

EmbarkJS.Storage.setProvider = function(provider, options) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        if (provider.toLowerCase() === EmbarkJS.Storage.Providers.IPFS) {
            //I don't think currentStorage is used anywhere, this might not be needed
            //for now until additional storage providers are supported. But keeping it
            //anyways
            self.currentStorage = EmbarkJS.Storage.IPFS;

            try {
                if (options === undefined) {
                    self.ipfsConnection = IpfsApi('localhost', '5001');
                    self._getUrl = "http://localhost:8080/ipfs/";
                } else {
                    self.ipfsConnection = IpfsApi(options.server, options.port);
                    self._getUrl = options.getUrl || "http://localhost:8080/ipfs/";
                }
                resolve(self);
            } catch (err) {
                self.ipfsConnection = null;
                reject(new Error('Failed to connect to IPFS'));
            }
        } else if (provider.toLowerCase() === EmbarkJS.Storage.SWARM) {
            reject('Swarm not implemented');
            // TODO Implement Swarm
            // this.currentStorage = EmbarkJS.Storage.SWARM;
            // if (options === undefined) {
            //     //Connect to default Swarm node
            // } else {
            //     //Connect using options
            // }
        } else {
            reject('Unknown storage provider');
        }
    });
    return promise;
};

EmbarkJS.Storage.IPFS.saveText = function(text) {
    var promise = new Promise(function(resolve, reject) {
        if (!EmbarkJS.Storage.ipfsConnection) {
            var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
            reject(connectionError);
        }
        EmbarkJS.Storage.ipfsConnection.add((new EmbarkJS.Storage.ipfsConnection.Buffer(text)), function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result[0].path);
            }
        });
    });

    return promise;
};

EmbarkJS.Storage.IPFS.get = function(hash) {
    // TODO: detect type, then convert if needed
    //var ipfsHash = web3.toAscii(hash);
    var promise = new Promise(function(resolve, reject) {
        if (!EmbarkJS.Storage.ipfsConnection) {
            var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
            reject(connectionError);
        }
        EmbarkJS.Storage.ipfsConnection.object.get([hash]).then(function(node) {
            resolve(node.data);
        }).catch(function(err) {
            reject(err);
        });
    });

    return promise;
};

EmbarkJS.Storage.IPFS.uploadFile = function(inputSelector) {
    var file = inputSelector[0].files[0];

    if (file === undefined) {
        throw new Error('no file found');
    }

    var promise = new Promise(function(resolve, reject) {
        if (!EmbarkJS.Storage.ipfsConnection) {
            var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
            reject(connectionError);
        }
        var reader = new FileReader();
        reader.onloadend = function() {
            var fileContent = reader.result;
            var buffer = EmbarkJS.Storage.ipfsConnection.Buffer.from(fileContent);
            EmbarkJS.Storage.ipfsConnection.add(buffer, function(err, result) {
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

EmbarkJS.Storage.IPFS.getUrl = function(hash) {
    return (self._getUrl || "http://localhost:8080/ipfs/") + hash;
};

//=========================================================
// Embark Messaging
//=========================================================

EmbarkJS.Messages = {};

EmbarkJS.Messages.web3CompatibleWithV5 = function() {
  var _web3 = new Web3();
  if (typeof(_web3.version) === "string") {
    return true;
  }
  return parseInt(_web3.version.api.split('.')[1], 10) >= 20;
};

EmbarkJS.Messages.isNewWeb3 = function() {
  var _web3 = new Web3();
  if (typeof(_web3.version) === "string") {
    return true;
  }
  return parseInt(_web3.version.api.split('.')[0], 10) >= 1;
};

EmbarkJS.Messages.getWhisperVersion = function(cb) {
  if (this.isNewWeb3()) {
    this.currentMessages.web3.shh.getVersion(function(err, version) {
      cb(err, version);
    });
  } else {
    this.currentMessages.web3.version.getWhisper(function(err, res) {
      cb(err, web3.version.whisper);
    });
  }
};

EmbarkJS.Messages.setProvider = function(provider, options) {
    var self = this;
    var ipfs;
    if (provider === 'whisper') {
        this.providerName = 'whisper';
        this.currentMessages = EmbarkJS.Messages.Whisper;
        let provider;
        if (options === undefined) {
            provider = "localhost:8546";
        } else {
            provider = options.server + ':' + options.port;
        }
        if (this.isNewWeb3()) {
          self.currentMessages.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://" + provider));
        } else {
          self.currentMessages.web3 = new Web3(new Web3.providers.HttpProvider("http://" + provider));
        }
        self.getWhisperVersion(function(err, version) {
            if (err) {
                console.log("whisper not available");
            } else if (version >= 5) {
                if (self.web3CompatibleWithV5()) {
                  self.currentMessages.web3.shh.newSymKey().then((id) => {self.currentMessages.symKeyID = id;});
                  self.currentMessages.web3.shh.newKeyPair().then((id) => {self.currentMessages.sig = id;});
                } else {
                  console.log("this version of whisper in this node");
                }
            } else {
                self.currentMessages.identity = self.currentMessages.web3.shh.newIdentity();
            }
            self.currentMessages.whisperVersion = self.currentMessages.web3.version.whisper;
        });
    } else if (provider === 'orbit') {
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
    } else {
        throw Error('Unknown message provider');
    }
};

EmbarkJS.Messages.sendMessage = function(options) {
    return this.currentMessages.sendMessage(options);
};

EmbarkJS.Messages.listenTo = function(options) {
    return this.currentMessages.listenTo(options);
};

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

EmbarkJS.Messages.Orbit = {};

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

EmbarkJS.Utils = {
  fromAscii: function(str) {
    var _web3 = new Web3();
    return _web3.utils ? _web3.utils.fromAscii(str) : _web3.fromAscii(str);
  },
  toAscii: function(str) {
    var _web3 = new Web3();
    return _web3.utils.toAscii(str);
  }
};

module.exports = EmbarkJS;


/***/ })
/******/ ]);
});