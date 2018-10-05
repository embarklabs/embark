const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');
const namehash = require('eth-ens-namehash');
const async = require('async');
const embarkJsUtils = require('embarkjs').Utils;
const reverseAddrSuffix = '.addr.reverse';

const MAINNET_ID = '1';
const ROPSTEN_ID = '3';
const RINKEBY_ID = '4';

const ENS_CONTRACTS_CONFIG = {
  [MAINNET_ID]: {
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
  },
  [ROPSTEN_ID]: {
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
  },
  [RINKEBY_ID]: {
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
};

class ENS {
  constructor(embark, _options) {
    this.env = embark.env;
    this.logger = embark.logger;
    this.events = embark.events;
    this.namesConfig = embark.config.namesystemConfig;
    this.registration = this.namesConfig.register || {};
    this.embark = embark;
    this.ensConfig = require('./ensContractConfigs');
    this.configured = false;

    if (this.namesConfig === {} ||
      this.namesConfig.enabled !== true ||
      this.namesConfig.available_providers.indexOf('ens') < 0) {
      return;
    }
    this.doSetENSProvider = this.namesConfig.provider === 'ens';

    this.addENSToEmbarkJS();
    this.registerEvents();
    this.registerConsoleCommands();
  }
  

  registerConsoleCommands() {
    this.embark.registerConsoleCommand((cmd, _options) => {
      let [cmdName, domain] = cmd.split(' ');
      return {
        match: () => cmdName === 'resolve',
        process: (cb) => global.EmbarkJS.Names.resolve(domain, cb)
      };
    });

    this.embark.registerConsoleCommand((cmd, _options) => {
      let [cmdName, address] = cmd.split(' ');
      return {
        match: () => cmdName === 'lookup',
        process: (cb) => global.EmbarkJS.Names.lookup(address, cb)
      };
    });

    this.embark.registerConsoleCommand((cmd, _options) => {
      let [cmdName, name, address] = cmd.split(' ');
      return {
        match: () => cmdName === 'registerSubDomain',
        process: (cb) => global.EmbarkJS.Names.registerSubDomain(name, address, cb)
      };
    });
  }

  registerEvents() {
    this.embark.registerActionForEvent("deploy:beforeAll", this.configureContractsAndRegister.bind(this));

    this.events.setCommandHandler("storage:ens:associate", this.associateStorageToEns.bind(this));
  }

  setProviderAndRegisterDomains(cb = (() => {})) {
    const self = this;
    let config = {
      env: self.env,
      registration: self.registration,
      registryAbi: self.ensConfig.ENSRegistry.abiDefinition,
      registryAddress: self.ensConfig.ENSRegistry.deployedAddress,
      registrarAbi: self.ensConfig.FIFSRegistrar.abiDefinition,
      registrarAddress: self.ensConfig.FIFSRegistrar.deployedAddress,
      resolverAbi: self.ensConfig.Resolver.abiDefinition,
      resolverAddress: self.ensConfig.Resolver.deployedAddress
    };

    if (self.doSetENSProvider) {
      self.addSetProvider(config);
    }

    self.events.request('blockchain:networkId', (networkId) => {
      const isKnownNetwork = Boolean(ENS_CONTRACTS_CONFIG[networkId]);
      const shouldRegisterSubdomain = self.registration && self.registration.subdomains && Object.keys(self.registration.subdomains).length;
      if (isKnownNetwork || !shouldRegisterSubdomain) {
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
      async.each(Object.keys(self.registration.subdomains), (subDomainName, eachCb) => {
        const address = self.registration.subdomains[subDomainName];
        const reverseNode = utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix);
        register(self.ensContract, self.registrarContract, self.resolverContract, defaultAccount, subDomainName, self.registration.rootDomain,
          reverseNode, address, self.logger, secureSend, eachCb);
      }, cb);
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

  configureContractsAndRegister(cb) {
    const self = this;
    if (self.configured) {
      return cb();
    }
    self.events.request('blockchain:networkId', (networkId) => {
      if (ENS_CONTRACTS_CONFIG[networkId]) {
        self.ensConfig = utils.recursiveMerge(self.ensConfig, ENS_CONTRACTS_CONFIG[networkId]);
      }

      async.waterfall([
        function registry(next) {
          self.events.request('deploy:contract', self.ensConfig.ENSRegistry, (err, _receipt) => {
            return next(err);
          });
        },
        function resolver(next) {
          self.ensConfig.Resolver.args = [self.ensConfig.ENSRegistry.deployedAddress];
          self.events.request('deploy:contract', self.ensConfig.Resolver, (err, _receipt) => {
            return next(err);
          });
        },
        function registrar(next) {
          if (!self.registration || !self.registration.rootDomain) {
            return next();
          }
          const registryAddress = self.ensConfig.ENSRegistry.deployedAddress;
          const rootNode = namehash.hash(self.registration.rootDomain);
          const contract = self.ensConfig.FIFSRegistrar;
          contract.args = [registryAddress, rootNode];

          self.events.request('deploy:contract', contract, (err, _receipt) => {
            return next(err);
          });
        },
        function registerRoot(next) {
          let config = {
            registryAbi: self.ensConfig.ENSRegistry.abiDefinition,
            registryAddress: self.ensConfig.ENSRegistry.deployedAddress,
            registrarAbi: self.ensConfig.FIFSRegistrar.abiDefinition,
            registrarAddress: self.ensConfig.FIFSRegistrar.deployedAddress,
            resolverAbi: self.ensConfig.Resolver.abiDefinition,
            resolverAddress: self.ensConfig.Resolver.deployedAddress
          };
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
            },
            function getWeb3(paraCb) {
              self.events.request("blockchain:get",
                (web3) => {
                  paraCb(null, web3);
                });
            }
          ], (err, result) => {
            self.ensContract = result[0];
            self.registrarContract = result[1];
            self.resolverContract = result[2];
            const web3 = result[3];

            const rootNode = namehash.hash(self.registration.rootDomain);
            var reverseNode = web3.utils.soliditySha3(web3.eth.defaultAccount.toLowerCase().substr(2) + reverseAddrSuffix);
            self.ensContract.methods.setOwner(rootNode, web3.eth.defaultAccount).send({from: web3.eth.defaultAccount, gas: 700000}).then(() => {
              return self.ensContract.methods.setResolver(rootNode, config.resolverAddress).send({from: web3.eth.defaultAccount, gas: 700000});
            }).then(() => {
              return self.ensContract.methods.setResolver(reverseNode, config.resolverAddress).send({from: web3.eth.defaultAccount, gas: 700000});
            }).then(() => {
              return self.resolverContract.methods.setAddr(rootNode, web3.eth.defaultAccount).send({from: web3.eth.defaultAccount, gas: 700000});
            }).then(() => {
              return self.resolverContract.methods.setName(reverseNode, self.registration.rootDomain).send({from: web3.eth.defaultAccount, gas: 700000});
            }).then((_result) => {
              next();
            })
            .catch(err => {
              self.logger.error('Error while registering the root domain');
              if (err.message.indexOf('Transaction has been reverted by the EVM') > -1) {
                return next(__('Registration was rejected. Did you change the deployment account? If so, delete chains.json'));
              }
              next(err);
            });
          });
        }
      ], (err) => {
        self.configured = true;
        if (err) {
          self.logger.error('Error while deploying ENS contracts');
          self.logger.error(err.message || err);
          return cb(err);
        }
        self.setProviderAndRegisterDomains(cb);
      });
    });
  }

  addSetProvider(config) {
    let code = "\nEmbarkJS.Names.setProvider('ens'," + JSON.stringify(config) + ");";

    let shouldInit = (namesConfig) => {
      return (namesConfig.provider === 'ens' && namesConfig.enabled === true);
    };

    this.embark.addProviderInit('names', code, shouldInit);
    this.embark.addConsoleProviderInit('names', code, shouldInit);
  }
}

module.exports = ENS;
