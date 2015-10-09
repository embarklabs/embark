var readYaml = require('read-yaml');
var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
var commander = require('commander');
var wrench = require('wrench');
var syncMe = require('sync-me');

//var Tests = require('./test.js');
var Blockchain = require('./blockchain.js');
var Deploy = require('./deploy.js');
var Release = require('./ipfs.js');
var Config = require('./config/config.js');
var Compiler = require('./compiler.js');
var ChainManager = require('./chain_manager.js');
var Test = require('./test.js');

Embark = {
  init: function(_web3) {
    this.blockchainConfig = (new Config.Blockchain());
    this.compiler         = (new Compiler(this.blockchainConfig));
    this.contractsConfig  = (new Config.Contracts(this.blockchainConfig, this.compiler));
    if (_web3 !== undefined) {
      this.web3 = _web3;
    }
    else {
      this.web3 = web3;
    }
    this.chainManager     = (new ChainManager(this.web3));
  },

  //tests: function() {
  //  return new Tests();
  //},

  startBlockchain: function(env, use_tmp) {
    var chain = new Blockchain(this.blockchainConfig.config(env));
    chain.startChain(use_tmp);
  },

  copyMinerJavascriptToTemp: function(){
    //TODO: better with --exec, but need to fix console bug first
    wrench.copyDirSyncRecursive(__dirname + "/../js", "/tmp/js", {forceDelete: true});
  },

  getStartBlockchainCommand: function(env, use_tmp) {
    var chain = new Blockchain(this.blockchainConfig.config(env));
    return chain.getStartChainCommand(use_tmp);
  },

  deployContracts: function(env, contractFiles, destFile, chainFile, withProvider, cb) {
    this.contractsConfig.init(contractFiles, env);

    this.chainManager.loadConfigFile(chainFile)
    var deploy = new Deploy(env, contractFiles, this.blockchainConfig.config(env), this.contractsConfig, this.chainManager, this.web3);
    deploy.deploy_contracts(env, function() {
      console.log("contracts deployed; generating abi file");
      var result = ""
      if (withProvider) {
        result += deploy.generate_provider_file();
      }
      result += deploy.generate_abi_file();
      cb(result);
    });
  },

  geth: function(env, args) {
    var chain = new Blockchain(this.blockchainConfig.config(env));
    chain.execGeth(args);
  },

  release: Release,

  test: function(cb) {
    var tests = new Test(cb);
  }
}

module.exports = Embark;
