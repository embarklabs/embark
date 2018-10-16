let utils = require('../../utils/utils');

class Suggestions {
  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.registerApi();
    this.listenToEvents();
    this.contracts = {}
  }

  registerApi() {
    this.embark.registerAPICall('post', '/embark-api/suggestions', (req, res) => {
      let suggestions = this.getSuggestions(req.body.command)
      res.send({result: suggestions})
    });
  }

  listenToEvents() {
    this.events.on("deploy:contract:deployed", (contract) => {
      this.contracts[contract.className] = contract
    })
  }

  getSuggestions(cmd) {
    cmd = cmd.toLowerCase()

    suggestions.push({value: 'web3.eth', command_type: "web3 object", description: "module for interacting with the Ethereum network"})
    suggestions.push({value: 'web3.net', command_type: "web3 object", description: "module for interacting with network properties"})
    suggestions.push({value: 'web3.shh', command_type: "web3 object", description: "module for interacting with the whisper protocol"})
    suggestions.push({value: 'web3.bzz', command_type: "web3 object", description: "module for interacting with the swarm network"})
    suggestions.push({value: 'web3.eth.getAccounts()', command_type: "web3 object", description: "get list of accounts"})

    let suggestions = []
    for (let contractName in this.contracts) {
      let contract = this.contracts[contractName]
      suggestions.push({value: contract.className, command_type: "web3 object", description: "contract deployed at " + contract.deployedAddress});

      suggestions.push({value: "profile " + contract.className, command_type: "embark command", description: "profile " + contract.className + " contract"});
    }

    // TODO: make this registered through an API instead

    suggestions.push({value: 'help', command_type: "embark command", description: "displays quick list of some of the available embark commands"});
    suggestions.push({value: 'versions', command_type: "embark command", description: "display versions in use for libraries and tools like web3 and solc"});
    suggestions.push({value: 'ipfs', command_type: "javascript object", description: "instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)"});
    suggestions.push({value: 'swarm', command_type: "javascript object", description: "instantiated swarm-api object configured to the current environment (available if swarm is enabled)"});
    suggestions.push({value: 'web3', command_type: "javascript object", description: "instantiated web3.js object configured to the current environment"});
    suggestions.push({value: 'EmbarkJS', command_type: "javascript object", description: "EmbarkJS static functions for Storage, Messages, Names, etc."});

    // sort first the ones that match the command at the beginning of the string, then prefer smaller commands first
    return utils.fuzzySearch(cmd, suggestions, (result) => { return result.value + " " + result.description }).map((x) => x.original).sort((x,y) => {
      let diff = x.value.indexOf(cmd) - y.value.indexOf(cmd)
      if (diff !== 0) return diff;
      return x.value.length - y.value.length;
    });
  }
}

module.exports = Suggestions;
