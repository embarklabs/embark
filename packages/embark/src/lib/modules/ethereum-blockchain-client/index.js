const async = require('async');
const Web3 = require('web3');
const embarkJsUtils = require('embarkjs').Utils;

class EthereumBlockchainClient {

  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;

    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.determineArguments.bind(this));
    this.events.request("blockchain:client:register", "ethereum", this.getClient.bind(this));
    this.events.request("deployment:deployer:register", "ethereum", this.deployer.bind(this));
  }

  getClient() {
    return {};
  }

  async deployer(contract, done) {
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    var web3 = new Web3(provider)
    // var web3 = new Web3("ws://localhost:8556")
    web3.eth.getAccounts().then((accounts) => {
      let account = accounts[0];
      // let contractObject = this.blockchain.ContractObject({abi: contract.abiDefinition});
      console.dir("== ethereum contract deployer")
      let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.address);
      // let deployObject = this.blockchain.deployContractObject(contractObject, {arguments: contractParams, data: dataCode});
      let contractObject = contractObj.deploy({ arguments: (contract.args || []), data: ("0x" + contract.code) });
      // this.blockchain.deployContractFromObject(deployObject,
      console.dir({ arguments: contract.args, data: ("0x" + contract.code) });
      console.dir("------- send")

      embarkJsUtils.secureSend(web3, contractObject, {
        from: account, gas: 800000
      }, true, (err, receipt) => {
        contract.deployedAddress = receipt.contractAddress;
        contract.transactionHash = receipt.transactionHash;
        done();
      }, (hash) => {
        console.dir('hash is ' + hash);
      });
    })
  }

  // TODO we can separate this into 3 separate methods, which will make it easier to test
  // determineArguments(suppliedArgs, contract, accounts, callback) {
  async determineArguments(params, callback) {
    let suppliedArgs = params.contract.args;
    let contract = params.contract;
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    let web3 = new Web3(provider)
    let accounts = await web3.eth.getAccounts();

    const self = this;

    let args = suppliedArgs;
    if (!Array.isArray(args)) {
      args = [];
      let abi = contract.abiDefinition.find((abi) => abi.type === 'constructor');

      for (let input of abi.inputs) {
        let inputValue = suppliedArgs[input.name];
        if (!inputValue) {
          this.logger.error(__("{{inputName}} has not been defined for {{className}} constructor", {inputName: input.name, className: contract.className}));
        }
        args.push(inputValue || "");
      }
    }

    function parseArg(arg, cb) {
      const match = arg.match(/\$accounts\[([0-9]+)]/);
      if (match) {
        if (!accounts[match[1]]) {
          return cb(__('No corresponding account at index %d', match[1]));
        }
        return cb(null, accounts[match[1]]);
      }
      let contractName = arg.substr(1);
      self.events.request('contracts:contract', contractName, (err, referedContract) => {
        // Because we're referring to a contract that is not being deployed (ie. an interface),
        // we still need to provide a valid address so that the ABI checker won't fail.
        cb(err, (referedContract.deployedAddress || ZERO_ADDRESS));
      });
    }

    function checkArgs(argus, cb) {
      async.map(argus, (arg, nextEachCb) => {
        if (arg[0] === "$") {
          return parseArg(arg, nextEachCb);
        }

        if (Array.isArray(arg)) {
          return checkArgs(arg, nextEachCb);
        }

        return nextEachCb(null, arg);

        // TODO: re-add after ENS is re-added OR better yet, move this to the ENS plugin
        // self.events.request('ens:isENSName', arg, (isENSName) => {
        //   if (isENSName) {
        //     return self.events.request("ens:resolve", arg, (err, address) => {
        //       if (err) {
        //         return nextEachCb(err);
        //       }
        //       nextEachCb(err, address);
        //     });
        //   }

        //   nextEachCb(null, arg);
        // });
      }, cb);
    }

    checkArgs(args, (err, realArgs) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = realArgs;
      callback(null, params);
    });
  }

}

module.exports = EthereumBlockchainClient;
