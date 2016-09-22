var Web3 = require('web3');
var async = require('async');

var ServicesMonitor = function(options) {
  this.logger = options.logger;
  this.interval = options.interval || 5000;
  this.config = options.config;
};

ServicesMonitor.prototype.startMonitor = function() {
  this.monitor = setInterval(this.check.bind(this), this.interval);
};

ServicesMonitor.prototype.stopMonitor = function() {
};

ServicesMonitor.prototype.check = function() {
  var self = this;
  async.waterfall([
    function connectWeb3(callback) {
      self.logger.trace('connectWeb3');
      var web3 = new Web3();
      var web3Endpoint = 'http://' + self.config.blockchainConfig.rpcHost + ':' + self.config.blockchainConfig.rpcPort;
      web3.setProvider(new web3.providers.HttpProvider(web3Endpoint));
      callback(null, web3, []);
    },
    function checkEthereum(web3, result, callback) {
      self.logger.trace('checkEthereum');
      var service = 'geth (Ethereum)';
      service = (web3.isConnected()) ? service.green : service.red;
      result.push(service);
      callback(null, web3, result);
    },
    function checkWhisper(web3, result, callback) {
      self.logger.trace('checkWhisper');
      web3.version.getWhisper(function(err, res) {
        var service = 'whisper';
        result.push(err ? service.red : service.green);
        callback(null, result);
      });
    },
    function checkIPFS(result, callback) {
      self.logger.trace('checkIPFS');
      result.push('IPFS'.green);
      callback(null, result);
    },
    function checkDevServer(result, callback) {
      self.logger.trace('checkDevServer');
      result.push('dev server (http://localhost:8000)'.green);
      callback(null, result);
    }
  ], function(err, result) {
    self.logger.availableServices(result);
  });
};

module.exports = ServicesMonitor;
