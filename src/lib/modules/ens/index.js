const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');
const namehash = require('eth-ens-namehash');
const async = require('async');
const embarkJsUtils = require('embarkjs').Utils;
const reverseAddrSuffix = '.addr.reverse';
const ENSFunctions = require('./ENSFunctions');
import {ZERO_ADDRESS} from '../../utils/addressUtils';
import {ens} from '../../constants';

const ENS_WHITELIST = ens.whitelist;
const NOT_REGISTERED_ERROR = 'Name not yet registered';

const MAINNET_ID = '1';
const ROPSTEN_ID = '3';
const RINKEBY_ID = '4';
// Price of ENS registration contract functions
const ENS_GAS_PRICE = 700000;

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
    this.enabled = false;
    this.registration = this.namesConfig.register || {};
    this.embark = embark;
    this.ensConfig = require('./ensContractConfigs');
    this.configured = false;

    this.events.setCommandHandler("ens:resolve", this.ensResolve.bind(this));
    this.events.setCommandHandler("ens:isENSName", this.isENSName.bind(this));

    if (this.namesConfig === {} ||
      this.namesConfig.enabled !== true ||
      this.namesConfig.available_providers.indexOf('ens') < 0) {
      return;
    }
    this.enabled = true;
    this.doSetENSProvider = this.namesConfig.provider === 'ens';

    this.addENSToEmbarkJS();
    this.registerEvents();
    this.registerConsoleCommands();
  }

  reset() {
    this.configured = false;
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      usage: 'resolve <name>',
      description: __('Resolves an ENS name'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'resolve';
      },
      process: (cmd, cb) => {
      let [_cmdName, domain] = cmd.split(' ');
      global.EmbarkJS.Names.resolve(domain, cb);
    }
    });

    this.embark.registerConsoleCommand({
      usage: 'lookup <address>',
      description: __('Lookup an ENS address'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'lookup';
      },
      process: (cmd, cb) => {
        let [_cmdName, address] = cmd.split(' ');
        global.EmbarkJS.Names.lookup(address, cb);
      }
    });


    this.embark.registerConsoleCommand({
      usage: 'registerSubDomain <subDomain>',
      description: __('Register an ENS sub-domain'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'registerSubDomain';
      },
      process: (cmd, cb) => {
        let [_cmdName, name, address] = cmd.split(' ');
        global.EmbarkJS.Names.registerSubDomain(name, address, cb);
      }
    });
  }

  registerEvents() {
    this.embark.registerActionForEvent("deploy:beforeAll", this.configureContractsAndRegister.bind(this));
    this.events.on('blockchain:reseted', this.reset.bind(this));
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

    if (!this.isENSName(name)) {
      return cb(__('Invalid domain name: {{name}}\nValid extensions are: {{extenstions}}', {name, extenstions: ENS_WHITELIST.join(', ')}));
    }

    let hashedName = namehash.hash(name);
    let contentHash;
    try {
      contentHash = utils.hashTo32ByteHexString(storageHash);
    } catch (e) {
      return cb(__('Invalid IPFS hash'));
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
          if (resolverAddress === ZERO_ADDRESS) {
            return cb(NOT_REGISTERED_ERROR);
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
    const secureSend = embarkJsUtils.secureSend;

    this.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
      async.each(Object.keys(this.registration.subdomains), (subDomainName, eachCb) => {
        const address = this.registration.subdomains[subDomainName];
        const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);
        this.ensResolve(`${subDomainName}.${this.registration.rootDomain}`, (error, currentAddress) => {
          if (currentAddress && currentAddress.toLowerCase() === address.toLowerCase()) {
            return eachCb();
          }

          if (error !== NOT_REGISTERED_ERROR) {
            this.logger.error(__('Error resolving %s', `${subDomainName}.${this.registration.rootDomain}`));
            return eachCb(error);
          }

          const directives = directivesRegExp.exec(address);
          if (directives && directives.length) {
            this.embark.registerActionForEvent("contracts:deploy:afterAll", async (deployActionCb) => {
              this.events.request("contracts:contract", directives[1], (contract) => {
                if(!contract) return deployActionCb(); // if the contract is not registered in the config, it will be undefined here
                const reverseNode = utils.soliditySha3(contract.deployedAddress.toLowerCase().substr(2) + reverseAddrSuffix);
                this.registerSubDomain(defaultAccount, subDomainName, reverseNode, contract.deployedAddress, secureSend, deployActionCb);
              });
            });
            return eachCb();
          }

          const reverseNode = utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix);
          this.registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, eachCb);
        });
      }, cb);
    });
  }

  registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, cb) {
    ENSFunctions.registerSubDomain(this.ensContract, this.registrarContract, this.resolverContract, defaultAccount,
      subDomainName, this.registration.rootDomain, reverseNode, address, this.logger, secureSend, cb);
  }

  createResolverContract(config, callback) {
    this.events.request("blockchain:contract:create", {
      abi: config.resolverAbi,
      address: config.resolverAddress
    }, (resolver) => {
      callback(null, resolver);
    });
  }

  registerAPI() {
    let self = this;

    const createInternalResolverContract = function (resolverAddress, callback) {
      self.createResolverContract({resolverAbi: self.ensConfig.Resolver.abiDefinition, resolverAddress}, callback);
    };

    self.embark.registerAPICall(
      'get',
      '/embark-api/ens/resolve',
      (req, res) => {
        async.waterfall([
          function (callback) {
            ENSFunctions.resolveName(req.query.name, self.ensContract, createInternalResolverContract.bind(self), callback);
          }
        ], function (error, address) {
          if (error) {
            return res.send({error: error.message});
          }
          res.send({address});
        });
      }
    );

    self.embark.registerAPICall(
      'get',
      '/embark-api/ens/lookup',
      (req, res) => {
        async.waterfall([
          function (callback) {
            ENSFunctions.lookupAddress(req.query.address, self.ensContract, utils, createInternalResolverContract.bind(self), callback);
          }
        ], function (error, name) {
          if (error) {
            return res.send({error: error || error.message});
          }
          res.send({name});
        });
      }
    );

    self.embark.registerAPICall(
      'post',
      '/embark-api/ens/register',
      (req, res) => {
        self.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
          const secureSend = embarkJsUtils.secureSend;
          const {subdomain, address} = req.body;
          const reverseNode = utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix);
          ENSFunctions.registerSubDomain(self.ensContract, self.registrarContract, self.resolverContract, defaultAccount,
            subdomain, self.registration.rootDomain, reverseNode, address, self.logger, secureSend, (error) => {
              if (error) {
                return res.send({error: error || error.message});
              }
              res.send({name: `${req.body.subdomain}.${self.registration.rootDomain}`, address: req.body.address});
            });
        });
      }
    );
  }

  addENSToEmbarkJS() {
    const self = this;

    // get namehash, import it into file
    self.events.request("version:get:eth-ens-namehash", function (EnsNamehashVersion) {
      let currentEnsNamehashVersion = require('../../../../package.json').dependencies["eth-ens-namehash"];
      if (EnsNamehashVersion !== currentEnsNamehashVersion) {
        self.events.request("version:getPackageLocation", "eth-ens-namehash", EnsNamehashVersion, function (err, location) {
          self.embark.registerImportFile("eth-ens-namehash", fs.dappPath(location));
        });
      }
    });

    let code = fs.readFileSync(utils.joinPath(__dirname, 'ENSFunctions.js')).toString();
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Names.registerProvider('ens', __embarkENS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  addSetProvider(config) {
    let code = "\nEmbarkJS.Names.setProvider('ens'," + JSON.stringify(config) + ");";

    let shouldInit = (namesConfig) => {
      return (namesConfig.provider === 'ens' && namesConfig.enabled === true);
    };

    this.embark.addProviderInit('names', code, shouldInit);
    this.embark.addConsoleProviderInit('names', code, shouldInit);
  }

  configureContractsAndRegister(cb) {
    const NO_REGISTRATION = 'NO_REGISTRATION';
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
        function checkRootNode(next) {
          if (!self.registration || !self.registration.rootDomain) {
            return next(NO_REGISTRATION);
          }
          if (!self.isENSName(self.registration.rootDomain)) {

            return next(__('Invalid domain name: {{name}}\nValid extensions are: {{extenstions}}',
              {name: self.registration.rootDomain, extenstions: ENS_WHITELIST.join(', ')}));
          }
          next();
        },
        function registrar(next) {
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
          ], async (err, result) => {
            self.ensContract = result[0];
            self.registrarContract = result[1];
            self.resolverContract = result[2];
            const web3 = result[3];

            const rootNode = namehash.hash(self.registration.rootDomain);
            var reverseNode = web3.utils.soliditySha3(web3.eth.defaultAccount.toLowerCase().substr(2) + reverseAddrSuffix);
            const owner = await self.ensContract.methods.owner(rootNode).call();

            if (owner === web3.eth.defaultAccount) {
              return next();
            }

            self.ensContract.methods.setOwner(rootNode, web3.eth.defaultAccount).send({from: web3.eth.defaultAccount, gas: ENS_GAS_PRICE}).then(() => {
              return self.ensContract.methods.setResolver(rootNode, config.resolverAddress).send({from: web3.eth.defaultAccount, gas: ENS_GAS_PRICE});
            }).then(() => {
              return self.ensContract.methods.setResolver(reverseNode, config.resolverAddress).send({from: web3.eth.defaultAccount, gas: ENS_GAS_PRICE});
            }).then(() => {
              return self.resolverContract.methods.setAddr(rootNode, web3.eth.defaultAccount).send({from: web3.eth.defaultAccount, gas: ENS_GAS_PRICE});
            }).then(() => {
              return self.resolverContract.methods.setName(reverseNode, self.registration.rootDomain).send({from: web3.eth.defaultAccount, gas: ENS_GAS_PRICE});
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
        if (err && err !== NO_REGISTRATION) {
          self.logger.error('Error while deploying ENS contracts');
          self.logger.error(err.message || err);
          return cb(err);
        }
        self.registerAPI();
        self.setProviderAndRegisterDomains(cb);
      });
    });
  }

  ensResolve(name, cb) {
    const self = this;
    if (!self.enabled) {
      return cb('ENS not enabled');
    }
    if (!self.configured) {
      return cb('ENS not configured');
    }
    const hashedName = namehash.hash(name);
    async.waterfall([
      function getResolverAddress(next) {
        self.ensContract.methods.resolver(hashedName).call((err, resolverAddress) => {
          if (err) {
            return next(err);
          }
          if (resolverAddress === ZERO_ADDRESS) {
            return next(NOT_REGISTERED_ERROR);
          }
          next(null, resolverAddress);
        });
      },
      function createResolverContract(resolverAddress, next) {
        self.events.request("blockchain:contract:create",
          {abi: self.ensConfig.Resolver.abiDefinition, address: resolverAddress},
          (resolver) => {
            next(null, resolver);
          });
      },
      function resolveName(resolverContract, next) {
        resolverContract.methods.addr(hashedName).call(next);
      }
    ], cb);
  }

  isENSName(name, callback = () => {}) {
    if (typeof name !== 'string') {
      callback(false);
      return false;
    }
    const result = Boolean(ENS_WHITELIST.find(ensExt => name.endsWith(ensExt)));
    callback(result);
    return result;
  }
}

module.exports = ENS;


