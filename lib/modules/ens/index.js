const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');
const namehash = require('eth-ens-namehash');
const async = require('async');
const embarkJsUtils = require('embarkjs').Utils;
const reverseAddrSuffix = '.addr.reverse';

class ENS {
  constructor(embark, _options) {
    this.env = embark.env;
    this.isDev = embark.config.blockchainConfig.isDev;
    this.logger = embark.logger;
    this.events = embark.events;
    this.namesConfig = embark.config.namesystemConfig;
    this.registration = this.namesConfig.register || {};
    this.embark = embark;

    if (this.namesConfig === {} ||
      this.namesConfig.enabled !== true ||
      this.namesConfig.available_providers.indexOf('ens') < 0) {
      return;
    }
    this.doSetENSProvider = this.namesConfig.provider === 'ens';

    this.addENSToEmbarkJS();
    this.configureContracts();
    this.registerEvents();
  }

  registerEvents() {
    this.embark.registerActionForEvent("contracts:deploy:afterAll", this.setProviderAndRegisterDomains.bind(this));

    this.events.setCommandHandler("storage:ens:associate", this.associateStorageToEns.bind(this));
  }

  setProviderAndRegisterDomains(cb) {
    const self = this;
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
        env: self.env,
        registration: self.registration,
        registryAbi: results[0].abiDefinition,
        registryAddress: results[0].deployedAddress,
        registrarAbi: results[1].abiDefinition,
        registrarAddress: results[1].deployedAddress,
        resolverAbi: results[2].abiDefinition,
        resolverAddress: results[2].deployedAddress
      };

      if (self.doSetENSProvider) {
        self.addSetProvider(config);
      }

      if ((!self.isDev && self.env !== 'privatenet') || !self.registration || !self.registration.subdomains || !Object.keys(self.registration.subdomains).length) {
        return cb();
      }
      self.registerConfigDomains(config, cb);
    });
  }

  associateStorageToEns(options, cb) {
    const self = this;
    // Code inspired by https://github.com/monkybrain/ipfs-to-ens
    const {name, storageHash} = options;

    if (!utils.isValidEthDomain(name)) {
      return cb('Invalid domain name ' + name);
    }

    let hashedName = namehash.hash(name);
    let contentHash;
    try {
      contentHash = utils.hashTo32ByteHexString(storageHash);
    } catch (e) {
      return cb('Invalid IPFS hash');
    }

    // Set content
    async.waterfall([
      function getRegistryABI(next) {
        self.events.request('contracts:contract', "ENSRegistry", (contract) => {
          next(null, contract);
        });
      },
      function createRegistryContract(contract, next) {
        self.events.request("blockchain:contract:create",
          {abi: contract.abiDefinition, address: contract.deployedAddress},
          (resolver) => {
            next(null, resolver);
          });
      },
      function getResolverForName(registry, next) {
        registry.methods.resolver(hashedName).call((err, resolverAddress) => {
          if (err) {
            return cb(err);
          }
          if (resolverAddress === '0x0000000000000000000000000000000000000000') {
            return cb('Name not yet registered');
          }
          next(null, resolverAddress);
        });
      },
      function getResolverABI(resolverAddress, next) {
        self.events.request('contracts:contract', "Resolver", (contract) => {
          next(null, resolverAddress, contract);
        });
      },
      function createResolverContract(resolverAddress, contract, next) {
        self.events.request("blockchain:contract:create",
          {abi: contract.abiDefinition, address: resolverAddress},
          (resolver) => {
            next(null, resolver);
          });
      },
      function getDefaultAccount(resolver, next) {
        self.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
          next(null, resolver, defaultAccount);
        });
      },
      function setContent(resolver, defaultAccount, next) {
        resolver.methods.setContent(hashedName, contentHash).send({from: defaultAccount}).then((transaction) => {
          if (transaction.status !== "0x1" && transaction.status !== "0x01" && transaction.status !== true) {
            return next('Association failed. Status: ' + transaction.status);
          }
          next();
        }).catch(next);
      }
    ], cb);
  }

  registerConfigDomains(config, cb) {
    const self = this;
    const register = require('./register');
    const secureSend = embarkJsUtils.secureSend;
    self.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
      async.parallel([
        function createRegistryContract(paraCb) {
          self.events.request("blockchain:contract:create",
            {abi: config.registryAbi, address: config.registryAddress},
            (registry) => {
              paraCb(null, registry);
            });
        },
        function createRegistrarContract(paraCb) {
          self.events.request("blockchain:contract:create",
            {abi: config.registrarAbi, address: config.registrarAddress},
            (registrar) => {
              paraCb(null, registrar);
            });
        },
        function createResolverContract(paraCb) {
          self.events.request("blockchain:contract:create",
            {abi: config.resolverAbi, address: config.resolverAddress},
            (resolver) => {
              paraCb(null, resolver);
            });
        }
      ], function(err, contracts) {
        if (err) {
          return cb(err);
        }
        const [ens, registrar, resolver] = contracts;

        async.each(Object.keys(self.registration.subdomains), (subDomainName, eachCb) => {
          const address = self.registration.subdomains[subDomainName];
          const reverseNode = utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix);
          register(ens, registrar, resolver, defaultAccount, subDomainName, self.registration.rootDomain,
            reverseNode, address, self.logger, secureSend, eachCb);
        }, cb);

      });
    });
  }

  addENSToEmbarkJS() {
    const self = this;

    // get namehash, import it into file
    self.events.request("version:get:eth-ens-namehash", function(EnsNamehashVersion) {
      let currentEnsNamehashVersion = require('../../../package.json').dependencies["eth-ens-namehash"];
      if (EnsNamehashVersion !== currentEnsNamehashVersion) {
        self.events.request("version:getPackageLocation", "eth-ens-namehash", EnsNamehashVersion, function(err, location) {
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
    const config = {
      "default": {
        "gas": "auto",
        "contracts": {
          "ENS": {
            "deploy": false,
            "silent": true
          }
        }
      },
      "development": {
        "contracts": {
          "ENSRegistry": {
            "deploy": true,
            "silent": true,
            "args": []
          },
          "Resolver": {
            "deploy": true,
            "silent": true,
            "args": ["$ENSRegistry"]
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "ropsten": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
            "silent": true
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "rinkeby": {
        "contracts": {
          "ENSRegistry": {
            "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A",
            "silent": true
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "livenet": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x314159265dd8dbb310642f98f50c066173c1259b",
            "silent": true
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      }
    };
    config.testnet = config.ropsten;

    if (this.registration && this.registration.rootDomain) {
      // Register root domain if it is defined
      const rootNode = namehash.hash(this.registration.rootDomain);
      config.development.contracts['FIFSRegistrar'] = {
        "deploy": true,
        "silent": true,
        "args": ["$ENSRegistry", rootNode],
        "onDeploy": [
          `ENSRegistry.methods.setOwner('${rootNode}', web3.eth.defaultAccount).send({from: web3.eth.defaultAccount}).then(() => {
              ENSRegistry.methods.setResolver('${rootNode}', "$Resolver").send({from: web3.eth.defaultAccount});
              var reverseNode = web3.utils.soliditySha3(web3.eth.defaultAccount.toLowerCase().substr(2) + '${reverseAddrSuffix}');
              ENSRegistry.methods.setResolver(reverseNode, "$Resolver").send({from: web3.eth.defaultAccount});
              Resolver.methods.setAddr('${rootNode}', web3.eth.defaultAccount).send({from: web3.eth.defaultAccount});
              Resolver.methods.setName(reverseNode, '${this.registration.rootDomain}').send({from: web3.eth.defaultAccount});
              })`
        ]
      };
    }
    config.privatenet = config.development;
    this.embark.registerContractConfiguration(config);

    if (this.isDev || this.env === 'privatenet') {
      this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/ENSRegistry.sol'));
      this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/FIFSRegistrar.sol'));
      this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/Resolver.sol'));
    }
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
