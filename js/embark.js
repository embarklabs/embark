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
    //this.web3 = options.web3 || web3;
    this.web3 = options.web3 || window.web3;

    if (EmbarkJS.isNewWeb3()) {
      // TODO:
      // add default **from** address
      // add gasPrice
      ContractClass = new this.web3.eth.Contract(this.abi, this.address);
      ContractClass.setProvider(this.web3.currentProvider);
      ContractClass.options.data = this.code;

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

  this.web3.eth.sendTransaction(options);
};

EmbarkJS.Storage = {};

EmbarkJS.Storage.Providers = {};

EmbarkJS.Storage.saveText = function(text) {
  if (!this.currentStorage) {
    throw new Error('Storage provider not set; e.g EmbarkJS.Storage.setProvider("ipfs")');
  }
  return this.currentStorage.saveText(text);
};

EmbarkJS.Storage.get = function(hash) {
  if (!this.currentStorage) {
    throw new Error('Storage provider not set; e.g EmbarkJS.Storage.setProvider("ipfs")');
  }
  return this.currentStorage.get(hash);
};

EmbarkJS.Storage.uploadFile = function(inputSelector) {
  if (!this.currentStorage) {
    throw new Error('Storage provider not set; e.g EmbarkJS.Storage.setProvider("ipfs")');
  }
  return this.currentStorage.uploadFile(inputSelector);
};

EmbarkJS.Storage.getUrl = function(hash) {
  if (!this.currentStorage) {
    throw new Error('Storage provider not set; e.g EmbarkJS.Storage.setProvider("ipfs")');
  }
  return this.currentStorage.getUrl(hash);
};

EmbarkJS.Storage.registerProvider = function(providerName, obj) {
  EmbarkJS.Storage.Providers[providerName] = obj;
};

EmbarkJS.Storage.setProvider = function(provider, options) {
  let providerObj = this.Providers[provider];

  if (!providerObj) {
    throw new Error('Unknown storage provider');
  } 

  this.currentStorage = providerObj;

  return providerObj.setProvider(options);
};

EmbarkJS.Storage.isAvailable = function(){
  return this.currentStorage.isAvailable();
};

EmbarkJS.Messages = {};

EmbarkJS.Messages.Providers = {};

EmbarkJS.Messages.registerProvider = function(providerName, obj) {
  EmbarkJS.Messages.Providers[providerName] = obj;
};

EmbarkJS.Messages.setProvider = function(provider, options) {
  let providerObj = this.Providers[provider];

  if (!providerObj) {
    throw new Error('Unknown messages provider');
  }

  this.currentMessages = providerObj;

  return providerObj.setProvider(options);
};

EmbarkJS.Messages.isAvailable = function(){
  return this.currentMessages.isAvailable();
};

EmbarkJS.Messages.sendMessage = function(options) {
  if (!this.currentMessages) {
    throw new Error('Messages provider not set; e.g EmbarkJS.Messages.setProvider("whisper")');
  }
  return this.currentMessages.sendMessage(options);
};

EmbarkJS.Messages.listenTo = function(options, callback) {
  if (!this.currentMessages) {
    throw new Error('Messages provider not set; e.g EmbarkJS.Messages.setProvider("whisper")');
  }
  return this.currentMessages.listenTo(options, callback);
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

export default EmbarkJS;
