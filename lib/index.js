var hashmerge = require('hashmerge');
var readYaml = require('read-yaml');
var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
var express = require('express');
var compression = require('compression');
var commander = require('commander');
var wrench = require('wrench');
var python = require('python');
var syncMe = require('sync-me');
var methodmissing = require('methodmissing');
var jasmine = require('jasmine');

var Tests = require('./test.js');
var Blockchain = require('./blockchain.js');
var Deploy = require('./deploy.js');
var Release = require('./ipfs.js');
var Config = require('./config/config.js');

Embark = {
  init: function() {
    this.blockchainConfig = (new Config.BlockchainConfig());
    this.contractsConfig  = (new Config.ContractsConfig(this.blockchainConfig, web3));
  }
}

module.exports = Embark;

