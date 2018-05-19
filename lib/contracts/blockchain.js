const Web3 = require('web3');

class Blockchain {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.contractsConfig = options.contractsConfig;
    this.web3 = options.web3;
    this.addCheck = options.addCheck;

    if (!this.web3) {
      this.initWeb3();
    }
    this.registerServiceCheck();
    this.registerAccountRequests();
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

  registerAccountRequests() {
    const self = this;

    this.events.setCommandHandler("blockchain:defaultAccount:get", function(cb) {
      cb(self.defaultAccount);
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", function(account, cb) {
      self.setDefaultAccount(account);
      cb();
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

}

module.exports = Blockchain;

