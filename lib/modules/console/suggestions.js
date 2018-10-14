let utils = require('../../utils/utils');

class Suggestions {
  constructor(_embark, options) {
    this.plugins = options.plugins;
    this.registerApi();
  }

  registerApi() {
    let plugin = this.plugins.createPlugin('consoleApi', {});
    plugin.registerAPICall('post', '/embark-api/suggestions', (req, res) => {
      let suggestions = this.getSuggestions(req.body.command)
      res.send({result: suggestions})
    });
  }

  getSuggestions(cmd) {
    if (cmd === 'web3') {
      return [
        {value: 'web3.eth', command_type: "web3 object", description: "ethereum"},
        {value: 'web3.net', command_type: "web3 object", description: "network"},
        {value: 'web3.shh', command_type: "web3 object", description: "whisper"}
      ]
    }
    console.dir("printing suggestions for " + cmd);
    return [{value: 'hello', command_type: "embark", description: "says hello back!"}, {value: 'SimpleStorage', command_type: "web3 object", description: ""}, {value: 'web3.eth.getAccounts', command_type: "web3", description: "get list of accounts"}]
  }
}

module.exports = Suggestions;
