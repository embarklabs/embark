import {__} from 'embark-i18n';
import {AddressUtils, dappPath, hashTo32ByteHexString, recursiveMerge} from 'embark-utils';
const namehash = require('eth-ens-namehash');
const async = require('async');
import {dappArtifacts, ens} from 'embark-core/constants.json';
import EmbarkJS, {Utils as embarkJsUtils} from 'embarkjs';
import ensJS from 'embarkjs-ens';
const ENSFunctions = ensJS.ENSFunctions;
const Web3 = require('web3');

const ensConfig = require('./ensContractConfigs');
const secureSend = embarkJsUtils.secureSend;

const reverseAddrSuffix = '.addr.reverse';
const {ZERO_ADDRESS} = AddressUtils;
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
    this.fs = embark.fs;
    this.config = embark.config;
    this.enabled = false;
    this.embark = embark;
    this.ensConfig = ensConfig;
    this.configured = false;
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, dappArtifacts.symlinkDir);
    this.initated = false;

    this.events.request("namesystem:node:register", "ens", (readyCb) => {
      readyCb();
    });

    this.events.setCommandHandler("ens:resolve", this.ensResolve.bind(this));
    this.events.setCommandHandler("ens:isENSName", (name, cb) => {
      setImmediate(cb, this.isENSName(name));
    });

    this.init(() => {});
  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  get web3DefaultAccount() {
    return (async () => {
      const web3 = await this.web3;
      if (!web3.eth.defaultAccount) {
        const accounts = await web3.eth.getAccounts();
        web3.eth.defaultAccount = accounts[0];
      }
      return web3.eth.defaultAccount;
    })();
  }

  async init(cb = () => {}) {
    if (this.initated || this.config.namesystemConfig === {} ||
      this.config.namesystemConfig.enabled !== true ||
      !this.config.namesystemConfig.available_providers ||
      this.config.namesystemConfig.available_providers.indexOf('ens') < 0) {
      return cb();
    }
    this.enabled = true;
    this.doSetENSProvider = this.config.namesystemConfig.provider === 'ens';

    this.registerEmbarkJSNaming();
    this.registerEvents();
    this.registerConsoleCommands();
    this.events.request2("runcode:whitelist", 'eth-ens-namehash');
    this.events.request2("runcode:whitelist", 'embarkjs');
    this.events.request2("runcode:whitelist", 'embarkjs-ens');
    this.initated = true;
    cb();
  }

  reset() {
    this.configured = false;
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      usage: 'resolve [name]',
      description: __('Resolves an ENS name'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'resolve';
      },
      process: (cmd, cb) => {
        let [_cmdName, domain] = cmd.split(' ');
        EmbarkJS.Names.resolve(domain, cb);
      }
    });

    this.embark.registerConsoleCommand({
      usage: 'lookup [address]',
      description: __('Lookup an ENS address'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'lookup';
      },
      process: (cmd, cb) => {
        let [_cmdName, address] = cmd.split(' ');
        EmbarkJS.Names.lookup(address, cb);
      }
    });


    this.embark.registerConsoleCommand({
      usage: 'registerSubDomain [subDomain] [address]',
      description: __('Register an ENS sub-domain'),
      matches: (cmd) => {
        let [cmdName] = cmd.split(' ');
        return cmdName === 'registerSubDomain';
      },
      process: (cmd, cb) => {
        let [_cmdName, name, address] = cmd.split(' ');
        EmbarkJS.Names.registerSubDomain(name, address, cb);
      }
    });
  }

  registerEvents() {
    if (this.eventsRegistered) {
      return;
    }
    this.eventsRegistered = true;
    this.embark.registerActionForEvent("deployment:deployContracts:beforeAll", this.configureContractsAndRegister.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.modifyENSArguments.bind(this));
    this.events.on('blockchain:reseted', this.reset.bind(this));
    this.events.setCommandHandler("storage:ens:associate", this.associateStorageToEns.bind(this));
    this.events.setCommandHandler("ens:config", this.getEnsConfig.bind(this));
  }

  getEnsConfig(cb) {
    cb({
      env: this.env,
      registration: this.config.namesystemConfig.register,
      registryAbi: this.ensConfig.ENSRegistry.abiDefinition,
      registryAddress: this.ensConfig.ENSRegistry.deployedAddress,
      registrarAbi: this.ensConfig.FIFSRegistrar.abiDefinition,
      registrarAddress: this.ensConfig.FIFSRegistrar.deployedAddress,
      resolverAbi: this.ensConfig.Resolver.abiDefinition,
      resolverAddress: this.ensConfig.Resolver.deployedAddress
    });
  }

  setProviderAndRegisterDomains(cb = (() => {})) {
    this.getEnsConfig(async (config) => {
      if (this.doSetENSProvider) {
        this.addENSArtifact(config);
        this.connectEmbarkJSProvider(config);
      }

      const web3 = await this.web3;

      const networkId = await web3.eth.net.getId();
      const isKnownNetwork = Boolean(ENS_CONTRACTS_CONFIG[networkId]);
      const shouldRegisterSubdomain = this.config.namesystemConfig.register && this.config.namesystemConfig.register.subdomains && Object.keys(this.config.namesystemConfig.register.subdomains).length;
      if (isKnownNetwork || !shouldRegisterSubdomain) {
        return cb();
      }

      this.registerConfigDomains(config, cb);
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
      contentHash = hashTo32ByteHexString(storageHash);
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

  async registerConfigDomains(config, cb) {
    const defaultAccount = await this.web3DefaultAccount;
    async.each(Object.keys(this.config.namesystemConfig.register.subdomains), (subDomainName, eachCb) => {
      const address = this.config.namesystemConfig.register.subdomains[subDomainName];
      const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);

      const directives = directivesRegExp.exec(address);
      if (!directives || !directives.length) {
        return this.safeRegisterSubDomain(subDomainName, address, defaultAccount, eachCb);
      }

      // Register as an afterAll to get the contract the directive is pointing to
      this.embark.registerActionForEvent("contracts:deploy:afterAll", async (deployActionCb) => {
        if (!this.config.namesystemConfig.enabled) {
          // ENS was disabled
          return deployActionCb();
        }

        const currentDefaultAccount = await this.events.request2("blockchain:defaultAccount:get");
        if (defaultAccount !== currentDefaultAccount) {
          this.logger.trace(`Skipping registration of subdomain "${directives[1]}" as this action was registered for a previous configuration`);
          return deployActionCb();
        }

        const contract = await this.events.request2("contracts:contract", directives[1]);
        if (!contract) {
          // if the contract is not registered in the config, it will be undefined here
          this.logger.error(__('Tried to register the subdomain "{{subdomain}}" as contract "{{contractName}}", ' +
            'but "{{contractName}}" does not exist. Is it configured in your contract configuration?', {
            contractName: directives[1],
            subdomain: subDomainName
          }));
          return deployActionCb();
        }
        this.safeRegisterSubDomain(subDomainName, contract.deployedAddress, defaultAccount, deployActionCb);
      });
      return eachCb();
    }, cb);
  }

  safeRegisterSubDomain(subDomainName, address, defaultAccount, callback) {
    this.ensResolve(`${subDomainName}.${this.config.namesystemConfig.register.rootDomain}`, (error, currentAddress) => {
      if (currentAddress && currentAddress.toLowerCase() === address.toLowerCase()) {
        return callback();
      }

      if (error && error !== NOT_REGISTERED_ERROR) {
        this.logger.error(__('Error resolving %s', `${subDomainName}.${this.config.namesystemConfig.register.rootDomain}`));
        return callback(error);
      }

      const reverseNode = namehash.hash(address.toLowerCase().substr(2) + reverseAddrSuffix);
      this.registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, callback);
    });
  }

  async registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, cb) {
    const web3 = await this.web3;
    ENSFunctions.registerSubDomain(web3, this.ensContract, this.registrarContract, this.resolverContract, defaultAccount,
      subDomainName, this.config.namesystemConfig.register.rootDomain, reverseNode, address, this.logger, secureSend, cb, namehash);
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
            ENSFunctions.resolveName(req.query.name, self.ensContract, createInternalResolverContract.bind(self), callback, namehash);
          }
        ], function (error, address) {
          if (error) {
            return res.send({error: error.message || error});
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
            ENSFunctions.lookupAddress(req.query.address, self.ensContract, namehash, createInternalResolverContract.bind(self), callback);
          }
        ], function (error, name) {
          if (error) {
            return res.send({error: error.message || error});
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
          const {subdomain, address} = req.body;
          this.safeRegisterSubDomain(subdomain, address, defaultAccount, (error) => {
            if (error) {
              return res.send({error: error.message || error});
            }
            res.send({name: `${req.body.subdomain}.${self.config.namesystemConfig.register.rootDomain}`, address: req.body.address});
          });
        });
      }
    );
  }

  addENSArtifact(config, cb = () => {}) {
    const code = `
      var EmbarkJS;
      if (typeof EmbarkJS === 'undefined') {
        EmbarkJS = require('embarkjs');
      }
      const __embarkENS = require('embarkjs-ens');
      EmbarkJS.Names.registerProvider('ens', __embarkENS.default || __embarkENS);
      EmbarkJS.Names.setProvider('ens', ${JSON.stringify(config)});
    `;

    this.events.request("pipeline:register", {
      path: [this.config.embarkConfig.generationDir, 'ens'],
      file: 'init.js',
      format: 'js',
      content: code
    }, cb);

  }

  async registerEmbarkJSNaming() {
    const checkEmbarkJS = `return (typeof EmbarkJS === 'undefined');`;
    const EmbarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (EmbarkJSNotDefined) {
      await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
    }

    const registerProviderCode = `
      const __embarkENS = require('embarkjs-ens');
      EmbarkJS.Names.registerProvider('ens', __embarkENS.default || __embarkENS);
    `;

    await this.events.request2('runcode:eval', registerProviderCode);
  }

  async connectEmbarkJSProvider(config) {
    let providerCode = `\nEmbarkJS.Names.setProvider('ens', ${JSON.stringify(config)});`;
    await this.events.request2('runcode:eval', providerCode);
  }

  async configureContractsAndRegister(_options, cb) {
    const NO_REGISTRATION = 'NO_REGISTRATION';
    const self = this;
    if (self.configured) {
      return cb();
    }
    const registration = this.config.namesystemConfig.register;
    const web3 = await this.web3;

    const networkId = await web3.eth.net.getId();

    if (ENS_CONTRACTS_CONFIG[networkId]) {
      this.ensConfig = recursiveMerge(this.ensConfig, ENS_CONTRACTS_CONFIG[networkId]);
    }

    this.ensConfig.ENSRegistry = await this.events.request2('contracts:add', this.ensConfig.ENSRegistry);
    await this.events.request2('deployment:contract:deploy', this.ensConfig.ENSRegistry);

    this.ensConfig.Resolver.args = [this.ensConfig.ENSRegistry.deployedAddress];
    this.ensConfig.Resolver = await this.events.request2('contracts:add', this.ensConfig.Resolver);
    await this.events.request2('deployment:contract:deploy', this.ensConfig.Resolver);

    async.waterfall([
      function checkRootNode(next) {
        if (!registration || !registration.rootDomain) {
          return next(NO_REGISTRATION);
        }
        if (!self.isENSName(registration.rootDomain)) {
          return next(__('Invalid domain name: {{name}}\nValid extensions are: {{extenstions}}',
            {name: registration.rootDomain, extenstions: ENS_WHITELIST.join(', ')}));
        }
        next();
      },
      function registrar(next) {
        const registryAddress = self.ensConfig.ENSRegistry.deployedAddress;
        const rootNode = namehash.hash(registration.rootDomain);
        self.ensConfig.FIFSRegistrar.args = [registryAddress, rootNode];

        self.events.request('contracts:add', self.ensConfig.FIFSRegistrar, (_err, contract) => {
          self.ensConfig.FIFSRegistrar = contract;
          self.events.request('deployment:contract:deploy', self.ensConfig.FIFSRegistrar, (err) => {
            return next(err);
          });
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

        async function send() {
          self.ensContract = new web3.eth.Contract(config.registryAbi, config.registryAddress);
          self.registrarContract = new web3.eth.Contract(config.registrarAbi, config.registrarAddress);
          self.resolverContract = new web3.eth.Contract(config.resolverAbi, config.resolverAddress);

          const defaultAccount = await self.web3DefaultAccount;

          const rootNode = namehash.hash(registration.rootDomain);
          const reverseNode = namehash.hash(defaultAccount.toLowerCase().substr(2) + reverseAddrSuffix);
          const owner = await self.ensContract.methods.owner(rootNode).call();

          if (owner === defaultAccount) {
            return next();
          }

          // Set defaultAccount as the owner of the Registry
          secureSend(web3, self.ensContract.methods.setOwner(rootNode, defaultAccount), {
            from: defaultAccount,
            gas: ENS_GAS_PRICE
          }, false).then(() => {
            // Set Registry's resolver to the one deployed above
            return secureSend(web3, self.ensContract.methods.setResolver(rootNode, config.resolverAddress), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set reverse node's resolver to the one above (needed for reverse resolve)
            return secureSend(web3, self.ensContract.methods.setResolver(reverseNode, config.resolverAddress), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set node to the default account in the resolver (means that the ENS node now resolves to the account)
            return secureSend(web3, self.resolverContract.methods.setAddr(rootNode, defaultAccount), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set name of the reverse node to the root domain
            return secureSend(web3, self.resolverContract.methods.setName(reverseNode, registration.rootDomain), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then((_result) => {
            next();
          }).catch(err => {
            self.logger.error('Error while registering the root domain');
            if (err.message.indexOf('Transaction has been reverted by the EVM') > -1) {
              return next(__('Registration was rejected. Did you change the deployment account? If so, delete chains.json'));
            }
            next(err);
          });
        }
        send();
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
  }

  modifyENSArguments(params, callback) {
    const self = this;

    function checkArgs(argus, cb) {
      async.map(argus, (arg, nextEachCb) => {
        if (Array.isArray(arg)) {
          return checkArgs(arg, nextEachCb);
        }

        if (!self.isENSName(arg)) {
          return nextEachCb(null, arg);
        }
        self.ensResolve(arg,  (err, address) => {
          if (err) {
            return nextEachCb(err);
          }
          nextEachCb(null, address);
        });
      }, cb);
    }

    checkArgs(params.contract.args, (err, realArgs) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = realArgs;
      callback(null, params);
    });
  }

  async ensResolve(name, cb) {
    const self = this;
    if (!self.enabled) {
      return cb('ENS not enabled');
    }
    if (!self.configured) {
      return cb('ENS not configured');
    }
    const hashedName = namehash.hash(name);
    const web3 = await this.web3;
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
        const resolverContract = new web3.eth.Contract(self.ensConfig.Resolver.abiDefinition, resolverAddress);
        next(null, resolverContract);
      },
      function resolveName(resolverContract, next) {
        resolverContract.methods.addr(hashedName).call(next);
      }
    ], cb);
  }

  isENSName(name) {
    let test;
    if (typeof name !== 'string') {
      test = false;
    } else {
      test = ENS_WHITELIST.some(ensExt => name.endsWith(ensExt));
    }
    return test;
  }
}

module.exports = ENS;
