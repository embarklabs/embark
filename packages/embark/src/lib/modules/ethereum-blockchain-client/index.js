const Web3 = require('web3');
const embarkJsUtils = require('embarkjs').Utils;

class EthereumBlockchainClient {

  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;

    this.events.request("blockchain:client:register", "ethereum", this.getClient.bind(this));
    this.events.request("deployment:deployer:register", "ethereum", this.deployer.bind(this));
  }

  getClient() {
    return {};
  }

  deployer(contract, done) {
    var web3 = new Web3("ws://localhost:8556")
    web3.eth.getAccounts().then((accounts) => {
      let account = accounts[0];
      // let contractObject = this.blockchain.ContractObject({abi: contract.abiDefinition});
      console.dir("== ethereum contract deployer")
      console.dir(contract)
      console.dir("-------")
      console.dir("------- new web3")
      let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.address);
      // let deployObject = this.blockchain.deployContractObject(contractObject, {arguments: contractParams, data: dataCode});
      console.dir("------- deploy")
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

}

module.exports = EthereumBlockchainClient;
