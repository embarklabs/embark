/*global contract, config, it, assert, before*/
const Resolver = require('Embark/contracts/Resolver');

const namehash = require('eth-ens-namehash');
const address = '0x38ac14a9B6a7c8F9C46e4804074186c9F201D0A0';
const rootNode = namehash.hash('embark.eth');

config({
  contracts: {
    "ENSRegistry": {
      "args": []
    },
    "Resolver": {
      "args": ["$ENSRegistry"]
    },
    "FIFSRegistrar": {
      "args": ["$ENSRegistry", rootNode],
      "onDeploy": [
        `ENSRegistry.methods.setOwner('${rootNode}', web3.eth.defaultAccount).send().then(() => {
          ENSRegistry.methods.setResolver('${rootNode}', "$Resolver").send();
          Resolver.methods.setAddr('${rootNode}', '${address}').send().then(() => {
            global.ensTestReady = true;
          });
        });`
      ]
    }
  }
});

contract("ENS", function () {
  this.timeout(1000);

  before(function (done) {
  //   Wait for onDeploy to finish
    const wait = setInterval(() => {
      if (!global.ensTestReady) {
        return;
      }
      clearInterval(wait);
      done();
    });
  });

  it("should have registered embark.eth", async function () {
    const domainAddress = await Resolver.methods.addr(rootNode).call();
    assert.strictEqual(domainAddress, address);
  });
});
