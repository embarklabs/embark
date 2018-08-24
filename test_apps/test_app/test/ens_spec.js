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
          Resolver.methods.setAddr('${rootNode}', '${address}').send();
        });`
      ]
    }
  }
});

contract("ENS", function () {
  it("should have registered embark.eth", function () {
    let maxRetry = 20;
    let domainAddress;

    const wait = setInterval(async () => {
      domainAddress = await Resolver.methods.addr(rootNode).call();
      if (domainAddress || maxRetry === 0) {
        clearInterval(wait);
        assert.strictEqual(domainAddress, address);
        return;
      }
      maxRetry--;
    }, 50);
  });
});
