const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');
const namehash = require('eth-ens-namehash');
const async = require('async');

class ENS {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.namesConfig = embark.config.namesystemConfig;
    this.registration = this.namesConfig.register;
    this.embark = embark;

    // TODO add checks to see if config is ok
    this.addENSToEmbarkJS();
    this.configureContracts();
    this.registerEvents();
  }

  registerEvents() {
    const self = this;
    self.embark.registerActionForEvent("contracts:deploy:afterAll", (cb) => {
      async.parallel([
        function getENSRegistry(paraCb) {
          self.events.request('contracts:contract', "ENSRegistry", (contract) => {
            paraCb(null, contract);
          });
        },
        function getRegistrar(paraCb) {
          self.events.request('contracts:contract', "FIFSRegistrar", (contract) => {
            paraCb(null, contract);
          });
        },
        function getResolver(paraCb) {
          self.events.request('contracts:contract', "Resolver", (contract) => {
            paraCb(null, contract);
          });
        }
      ], (err, results) => {
        // result[0] => ENSRegistry; result[1] => FIFSRegistrar; result[2] => FIFSRegistrar
        let config = {
          registration: self.registration,
          registryAbi: results[0].abiDefinition,
          registryAddress: results[0].deployedAddress,
          registrarAbi: results[1].abiDefinition,
          registrarAddress: results[1].deployedAddress,
          resolverAbi: results[2].abiDefinition,
          resolverAddress: results[2].deployedAddress
        };
        self.addSetProvider(config);

        if (!self.registration || !self.registration.domains || !Object.keys(self.registration.domains).length) {
          return cb();
        }
        self.registerConfigDomains(config, cb);
      });
    });
  }

  registerConfigDomains(config, cb) {
    const self = this;
    self.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
      self.events.request("blockchain:contract:create",
        {abi: config.registrarAbi, address: config.registrarAddress},
        (registrar) => {
          async.each(Object.keys(self.registration.domains), (subDomainName, eachCb) => {
            const toSend = registrar.methods.register(utils.soliditySha3(subDomainName), defaultAccount);

            toSend.estimateGas().then(gasEstimated => {
              return toSend.send({gas: gasEstimated + 1000, from: defaultAccount}).then(transaction => {
                if (transaction.status !== "0x1" && transaction.status !== "0x01" && transaction.status !== true) {
                  return eachCb('Failed to register. Check gas cost.');
                }
                eachCb(null, transaction);
              }).catch(err => {
                eachCb('Failed to register with error: ' + (err.message || err));
              });
            }).catch(err => {
              eachCb("Register would error. Is it already registered? Do you have token balance? Is Allowance set? " + (err.message || err));
            });
          }, cb);
        });
    });
  }

  addENSToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.namesConfig === {}) {
      return;
    }

    if ((this.namesConfig.available_providers.indexOf('ens') < 0) && (this.namesConfig.provider !== 'ens' || this.namesConfig.enabled !== true)) {
      return;
    }

    // get namehash, import it into file
    self.events.request("version:get:eth-ens-namehash", function (EnsNamehashVersion) {
      let currentEnsNamehashVersion = require('../../../package.json').dependencies["eth-ens-namehash"];
      if (EnsNamehashVersion !== currentEnsNamehashVersion) {
        self.events.request("version:getPackageLocation", "eth-ens-namehash", EnsNamehashVersion, function (err, location) {
          self.embark.registerImportFile("eth-ens-namehash", fs.dappPath(location));
        });
      }
    });

    let code = fs.readFileSync(utils.joinPath(__dirname, 'register.js')).toString();
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Names.registerProvider('ens', __embarkENS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  configureContracts() {
    let rootNode = namehash.hash(this.registration.rootDomain);

    this.embark.registerContractConfiguration({
      "default": {
        "gas": "auto",
        "contracts": {
          "ENSRegistry": {
            "deploy": true,
            "args": []
          },
          "Resolver": {
            "deploy": true,
            "args": ["$ENSRegistry"]
          },
          "FIFSRegistrar": {
            "deploy": true,
            "args": ["$ENSRegistry", rootNode],
            "onDeploy": [
              `ENSRegistry.methods.setOwner('${rootNode}', web3.eth.defaultAccount).send().then(() => {
              ENSRegistry.methods.setResolver('${rootNode}', "$Resolver").send();
              var reverseNode = web3.utils.soliditySha3(web3.eth.defaultAccount.toLowerCase().substr(2) + '.addr.reverse');
              ENSRegistry.methods.setResolver(reverseNode, "$Resolver").send();
              Resolver.methods.setAddr('${rootNode}', web3.eth.defaultAccount).send();
              Resolver.methods.setName(reverseNode, '${this.registration.rootDomain}').send();
              })`
            ]
          }
        }
      },
      "ropsten": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010"
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "rinkeby": {
        "contracts": {
          "ENSRegistry": {
            "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "livenet": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x314159265dd8dbb310642f98f50c066173c1259b"
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      }
    });

    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/ENSRegistry.sol'));
    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/FIFSRegistrar.sol'));
    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/Resolver.sol'));
  }

  addSetProvider(config) {

    let code = "\nEmbarkJS.Names.setProvider('ens'," + JSON.stringify(config) + ");";

    let shouldInit = (namesConfig) => {
      return (namesConfig.provider === 'ens' && namesConfig.enabled === true);
    };

    this.embark.addProviderInit('names', code, shouldInit);
  }
}

module.exports = ENS;
