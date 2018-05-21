const Web3 = require('web3');

class Blockchain {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.contractsConfig = options.contractsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.web3 = options.web3;
    this.addCheck = options.addCheck;

    if (!this.web3) {
      this.initWeb3();
    }
    this.registerServiceCheck();
    this.registerRequests();
    this.registerWeb3Object();
  }

  initWeb3() {
    this.web3 = new Web3();
    if (this.contractsConfig.deployment.type === "rpc") {
      let web3Endpoint = 'http://' + this.contractsConfig.deployment.host + ':' + this.contractsConfig.deployment.port;
      this.web3.setProvider(new this.web3.providers.HttpProvider(web3Endpoint));
    } else {
      throw new Error("contracts config error: unknown deployment type " + this.contractsConfig.deployment.type);
    }
  }

  registerServiceCheck() {
    const self = this;

    this.addCheck('Ethereum', function (cb) {
      if (self.web3.currentProvider === undefined) {
        return cb({name: "No Blockchain node found", status: 'off'});
      }

      self.web3.eth.getAccounts(function(err, _accounts) {
        if (err) {
          return cb({name: "No Blockchain node found", status: 'off'});
        }

        // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
        self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
          if (err) {
            return cb({name: "Ethereum node (version unknown)", status: 'on'});
          }
          if (version.indexOf("/") < 0) {
            return cb({name: version, status: 'on'});
          }
          let nodeName = version.split("/")[0];
          let versionNumber = version.split("/")[1].split("-")[0];
          let name = nodeName + " " + versionNumber + " (Ethereum)";

          return cb({name: name, status: 'on'});
        });
      });
    });
  }

  registerRequests() {
    const self = this;

    this.events.setCommandHandler("blockchain:defaultAccount:get", function(cb) {
      cb(self.defaultAccount);
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", function(account, cb) {
      self.setDefaultAccount(account);
      cb();
    });

    this.events.setCommandHandler("blockchain:block:byNumber", function(blockNumber, cb) {
      self.getBlock(blockNumber, cb);
    });

  }

  defaultAccount() {
    return this.web3.eth.defaultAccount;
  }

  setDefaultAccount(account) {
    this.web3.eth.defaultAccount = account;
  }

  getAccounts(cb) {
    this.web3.eth.getAccounts(cb);
  }

  getCode(address, cb) {
    this.web3.eth.getCode(address, cb);
  }

  getBlock(blockNumber, cb) {
    this.web3.eth.getBlock(blockNumber, cb);
  }

  ContractObject(params) {
    return new this.web3.eth.Contract(params.abi);
  }

  deployContractObject(contractObject, params) {
    return contractObject.deploy({arguments: params.arguments, data: params.data});
  }

  estimateDeployContractGas(deployObject, cb) {
    return deployObject.estimateGas().then((gasValue) => {
      cb(null, gasValue);
    }).catch(cb);
  }

  deployContractFromObject(deployContractObject, params, cb) {
    deployContractObject.send({
      from: params.from, gas: params.gas, gasPrice: params.gasPrice
    }).on('receipt', function(receipt) {
      if (receipt.contractAddress !== undefined) {
        cb(null, receipt);
      }
    }).on('error', cb);
  }

  assertNodeConnection(cb) {
    const self = this;
    if (!self.web3) {
      return cb(Error("no web3 instance found"));
    }

    if (self.web3.currentProvider === undefined) {
      self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
      self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
      return cb(Error("error connecting to blockchain node"));
    }

    self.getAccounts(function(err, _accounts) {
      if (err) {
        self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
        self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
        return cb(Error("error connecting to blockchain node"));
      }
      return cb();
    });
  }

  determineDefaultAccount(cb) {
    const self = this;
    self.getAccounts(function (err, accounts) {
      if (err) {
        self.logger.error(err);
        return cb(new Error(err));
      }
      let accountConfig = self.blockchainConfig.account;
      let selectedAccount = accountConfig && accountConfig.address;
      self.setDefaultAccount(selectedAccount || accounts[0]);
      cb();
    });
  }

  registerWeb3Object() {
    // doesn't feel quite right, should be a cmd or plugin method
    // can just be a command without a callback
    this.events.emit("runcode:register", "web3", this.web3);
  }
}

module.exports = Blockchain;

