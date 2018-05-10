const ProviderEngine = require('web3-provider-engine');
// const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');

class Provider {
  constructor(web3Endpoint) {
    this.engine = new ProviderEngine();
    // this.web3 = new Web3(engine);

    this.engine.addProvider(new RpcSubprovider({
      rpcUrl: web3Endpoint
    }));

    this.engine.on('block', function (block) {
      console.log('================================');
      console.log('BLOCK CHANGED:', '#' + block.number.toString('hex'), '0x' + block.hash.toString('hex'));
      console.log('================================');
    });

    // network connectivity error
    this.engine.on('error', function (err) {
      // report connectivity errors
      console.error(err.stack);
    });
    this.engine.start();
  }

  sendAsync() {
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }
}

module.exports = Provider;
