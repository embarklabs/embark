var Web3 = require('web3');
var async = require('async');

var utils = require('./utils.js');

var ServicesMonitor = function(options) {
  this.logger = options.logger;
  this.interval = options.interval || 5000;
  this.config = options.config;
  this.serverHost = options.serverHost || 'localhost';
  this.serverPort = options.serverPort || 8000;
  this.runWebserver = options.runWebserver;
  this.version = options.version;
};

ServicesMonitor.prototype.startMonitor = function() {
  this.check();
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
    function addEmbarkVersion(web3, result, callback) {
      self.logger.trace('addEmbarkVersion');
      result.push(('Embark ' + self.version).green);
      callback(null, web3, result);
    },
    function checkEthereum(web3, result, callback) {
      self.logger.trace('checkEthereum');
      var service;
      if (web3.isConnected()) {
        service = (web3.version.node.split("/")[0] + " (Ethereum)").green;
      } else {
        service = "No Blockchain node found".red;
      }
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

      utils.checkIsAvailable('http://localhost:5001', function(available) {
        if (available) {
          result.push('IPFS'.green);
        } else {
          result.push('IPFS'.red);
        }
        callback(null, result);
      });
    },
    function checkDevServer(result, callback) {
      self.logger.trace('checkDevServer');
      var devServer = 'dev server (http://' + self.serverHost + ':' + self.serverPort + ')';
      devServer = (self.runWebserver) ? devServer.green : devServer.red;
      result.push(devServer);
      callback(null, result);
    }
  ], function(err, result) {
    if (err) {
      self.logger.error(err.message);
    } else {
      self.logger.availableServices(result);
    }
  });
};

module.exports = ServicesMonitor;
