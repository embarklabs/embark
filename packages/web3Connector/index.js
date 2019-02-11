const path = require('path');

module.exports = (embark) => {
  embark.events.on('runcode:ready', () => {
    embark.events.emit('runcode:register', '__web3Connector', require('./web3Connector'), false);
  });

  let code  = `\nconst __embarkWeb3 = global.__web3Connector || require('${path.join(__dirname, 'web3ConnectorBrowser.js').replace(/\\/g, '/')}').default;`;

  code += "\nEmbarkJS.Blockchain.registerProvider('web3', __embarkWeb3);";

  // TODO when we refactor code generator, refactor this to actually do something like connect
  code += "\nEmbarkJS.Blockchain.setProvider('web3', {});";

  embark.addCodeToEmbarkJS(code);

  code = "EmbarkJS.Blockchain.setProvider('web3', {});";

  const shouldInit = (_config) => {
    return true;
  };

  embark.addConsoleProviderInit('blockchain', code, shouldInit);
};
