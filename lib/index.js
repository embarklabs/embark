var hashmerge = require('hashmerge');
var readYaml = require('read-yaml');
var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
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
var Compiler = require('./compiler.js');
var ChainManager = require('./chain_manager.js');

Embark = {
  init: function() {
    this.blockchainConfig = (new Config.Blockchain());
    this.compiler         = (new Compiler(this.blockchainConfig));
    this.contractsConfig  = (new Config.Contracts(this.blockchainConfig, this.compiler));
    this.chainManager     = (new ChainManager());
  },

  tests: function(contractFiles) {
    return new Tests(this.contractsConfig, contractFiles);
  },

  startBlockchain: function(env, use_tmp) {
    var chain = new Blockchain(this.blockchainConfig.config(env));
    chain.startChain(use_tmp);
  },

  deployContracts: function(env, contractFiles, destFile, chainFile) {
    this.contractsConfig.init(contractFiles, env);

    this.chainManager.loadConfigFile(chainFile)
    var deploy = new Deploy(env, contractFiles, this.blockchainConfig.config(env), this.contractsConfig, this.chainManager);
    deploy.deploy_contracts(env);
    return deploy.generate_abi_file(destFile);
  },

  release: Release
}

module.exports = Embark;

