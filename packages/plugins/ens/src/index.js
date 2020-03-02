import {__} from 'embark-i18n';
import {recursiveMerge} from 'embark-utils';
const namehash = require('eth-ens-namehash');
const async = require('async');
import {ens} from 'embark-core/constants.json';
import {Utils as embarkJsUtils} from 'embarkjs';
import ensJS from 'embarkjs-ens';
import ensContractAddresses from './ensContractAddresses';
import EnsAPI from './api';
const ENSFunctions = ensJS.ENSFunctions;
const Web3 = require('web3');
const cloneDeep = require('lodash.clonedeep');

const ensConfig = require('./ensContractConfigs');
const secureSend = embarkJsUtils.secureSend;

const reverseAddrSuffix = '.addr.reverse';
const ENS_WHITELIST = ens.whitelist;
const NOT_REGISTERED_ERROR = 'Name not yet registered';

// Price of ENS registration contract functions
const ENS_GAS_PRICE = 700000;

class ENS {
  constructor(embark, _options) {
    this.env = embark.env;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.config = embark.config;
    this.enabled = false;
    this.embark = embark;
    this.ensConfig = cloneDeep(ensConfig);
    this.configured = false;
    this.initated = false;

    this.ensAPI = new EnsAPI(embark, {ens: this});

    this.events.request("namesystem:node:register", "ens", (readyCb) => {
      this.init(readyCb);
    }, this.executeCommand.bind(this));
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

  getEnsConfig(done) {
    async.map(
      this.config.namesystemConfig.dappConnection || this.config.contractsConfig.dappConnection,
      (conn, next) => {
        if (conn === '$EMBARK') {
          return this.events.request('proxy:endpoint:get', next);
        }
        next(null, conn);
      }, (err, connections) => {
        if (err) {
          return done(err);
        }
        done(null, {
          env: this.env,
          registration: this.config.namesystemConfig.register,
          registryAbi: this.ensConfig.ENSRegistry.abiDefinition,
          registryAddress: this.ensConfig.ENSRegistry.deployedAddress,
          registrarAbi: this.ensConfig.FIFSRegistrar.abiDefinition,
          registrarAddress: this.ensConfig.FIFSRegistrar.deployedAddress,
          resolverAbi: this.ensConfig.Resolver.abiDefinition,
          resolverAddress: this.ensConfig.Resolver.deployedAddress,
          dappConnection: connections
        });
      });
  }

  async init(cb = () => {}) {
    if (this.initated ||
      this.config.namesystemConfig.enabled !== true ||
      !this.config.namesystemConfig.available_providers ||
      this.config.namesystemConfig.available_providers.indexOf('ens') < 0) {
      return cb();
    }
    this.enabled = true;
    this.doSetENSProvider = this.config.namesystemConfig.provider === 'ens';

    this.registerActions();
    this.ensAPI.registerConsoleCommands();
    this.events.request("runcode:whitelist", 'eth-ens-namehash');
    this.initated = true;
    cb();
  }

  registerActions() {
    if (this.actionsRegistered) {
      return;
    }
    this.actionsRegistered = true;
    this.embark.registerActionForEvent("contracts:build:before", this.beforeContractBuild.bind(this));
    this.embark.registerActionForEvent("deployment:deployContracts:beforeAll", this.configureContractsAndRegister.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.modifyENSArguments.bind(this));
    this.embark.registerActionForEvent("deployment:deployContracts:afterAll", this.associateContractAddresses.bind(this));
    this.embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));
  }

  executeCommand(command, args, cb) {
    switch (command) {
      case 'resolve': this.ensResolve(args[0], cb); break;
      case 'lookup': this.ensLookup(args[0], cb); break;
      case 'registerSubdomain': this.ensRegisterSubdomain(args[0], args[1], cb); break;
      case 'reset': {
        this.configured = false;
        this.ensConfig = cloneDeep(ensConfig);
        cb();
        break;
      }
      default: cb(__('Unknown command %s', command));
    }
  }

  async addArtifactFile(_params, cb) {
    if (!this.embark.config.blockchainConfig.enabled) {
      return cb();
    }
    this.getEnsConfig((err, config) => {
      this.events.request("pipeline:register", {
        path: [this.config.embarkConfig.generationDir, 'config'],
        file: 'namesystem.json',
        format: 'json',
        dappAutoEnable: this.config.contractsConfig.dappAutoEnable,
        content: Object.assign({}, this.embark.config.namesystemConfig, config)
      }, cb);
    });
  }

  async setProviderAndRegisterDomains(cb = (() => {})) {
    if (!this.embark.config.blockchainConfig.enabled) {
      return cb();
    }
    this.getEnsConfig(async (err, config) => {
      if (err) {
        return cb(err);
      }
      if (this.doSetENSProvider) {
        this.setupEmbarkJS(config);
      }

      try {
        const web3 = await this.web3;
        const networkId = await web3.eth.net.getId();
        const isKnownNetwork = Boolean(ensContractAddresses[networkId]);
        const shouldRegisterSubdomain = this.config.namesystemConfig.register && this.config.namesystemConfig.register.subdomains && Object.keys(this.config.namesystemConfig.register.subdomains).length;
        if (isKnownNetwork || !shouldRegisterSubdomain) {
          return cb();
        }
        this.registerConfigDomains(config, cb);
      } catch (e) {
        cb(e);
      }
    });
  }

  async setupEmbarkJS(config) {
    this.events.request("embarkjs:plugin:register", 'names', 'ens', 'embarkjs-ens');
    await this.events.request2("embarkjs:console:register", 'names', 'ens', 'embarkjs-ens');
    this.events.request("embarkjs:console:setProvider", 'names', 'ens', config);
  }

  async registerConfigDomains(config, cb) {
    if (!this.config.namesystemConfig.register) {
      return cb();
    }
    const defaultAccount = await this.web3DefaultAccount;
    const web3 = await this.web3;

    async.each(Object.keys(this.config.namesystemConfig.register.subdomains), (subDomainName, eachCb) => {
      let address = this.config.namesystemConfig.register.subdomains[subDomainName];
      const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);

      // Using an anonymous function here because setting an async.js function as `async` creates issues
      (async () => {
        const directives = directivesRegExp.exec(address);
        if (directives && directives.length) {
          if (!directives[0].includes('accounts')) {
            return eachCb();
          }

          const match = address.match(/\$accounts\[([0-9]+)]/);
          const accountIndex = match[1];
          const accounts = await web3.eth.getAccounts();

          if (!accounts[accountIndex]) {
            return eachCb(__('No corresponding account at index %d', match[1]));
          }
          address = accounts[accountIndex];
        }
        this.safeRegisterSubDomain(subDomainName, address, defaultAccount, eachCb);
      })();
    }, cb);
  }

  async associateContractAddresses(params, cb) {
    if (!this.config.namesystemConfig.enabled) {
      return cb();
    }

    const defaultAccount = await this.web3DefaultAccount;

    if (!this.config.namesystemConfig.register || !this.config.namesystemConfig.register.subdomains) {
      return cb();
    }

    await Promise.all(Object.keys(this.config.namesystemConfig.register.subdomains || {}).map(async (subDomainName) => {
      const address = this.config.namesystemConfig.register.subdomains[subDomainName];
      const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);

      const directives = directivesRegExp.exec(address);
      if (!directives || !directives.length || directives[0].includes('accounts')) {
        return;
      }

      const contract = await this.events.request2("contracts:contract", directives[1]);
      if (!contract) {
        // if the contract is not registered in the config, it will be undefined here
        this.logger.error(__('Tried to register the subdomain "{{subdomain}}" as contract "{{contractName}}", ' +
          'but "{{contractName}}" does not exist. Is it configured in your contract configuration?', {
          contractName: directives[1],
          subdomain: subDomainName
        }));
        return;
      }
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      this.safeRegisterSubDomain(subDomainName, contract.deployedAddress, defaultAccount, (err) => {
        if (err) {
          this.logger.error(err);
        }
        resolve();
      });
      return promise;
    }));

    cb();
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
      this.registerSubDomain(defaultAccount, subDomainName, reverseNode, address.toLowerCase(), secureSend, callback);
    });
  }

  async registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, cb) {
    const web3 = await this.web3;
    ENSFunctions.registerSubDomain(web3, this.ensContract, this.registrarContract, this.resolverContract, defaultAccount,
      subDomainName, this.config.namesystemConfig.register.rootDomain, reverseNode, address, this.logger, secureSend, cb, namehash);
  }

  createResolverContract(resolverAddress, callback) {
    this.events.request("blockchain:contract:create", {
      abi: this.ensConfig.Resolver.abiDefinition,
      address: resolverAddress
    }, (resolver) => {
      callback(null, resolver);
    });
  }

  async beforeContractBuild(_options, cb) {
    if (this.configured) {
      return cb();
    }
    // Add contracts to contract manager so that they can be resolved as dependencies
    this.ensConfig.ENSRegistry = await this.events.request2('contracts:add', this.ensConfig.ENSRegistry);
    this.ensConfig.Resolver = await this.events.request2('contracts:add', this.ensConfig.Resolver);
    this.ensConfig.FIFSRegistrar = await this.events.request2('contracts:add', Object.assign({}, this.ensConfig.FIFSRegistrar, {deploy: false}));
    cb();
  }

  async configureContractsAndRegister(_options, cb) {
    const NO_REGISTRATION = 'NO_REGISTRATION';
    const self = this;
    if (self.configured) {
      return cb();
    }
    const web3 = await this.web3;

    const networkId = await web3.eth.net.getId();

    if (ensContractAddresses[networkId]) {
      if (this.config.namesystemConfig.register && this.config.namesystemConfig.register.rootDomain) {
        this.logger.warn(__("Cannot register subdomains on this network, because we do not own the ENS contracts. Are you on testnet or mainnet?"));
      }
      this.config.namesystemConfig.register = false; // force subdomains from being registered
      this.ensConfig = recursiveMerge(this.ensConfig, ensContractAddresses[networkId]);
    }

    const registration = this.config.namesystemConfig.register;
    const doRegister = registration && registration.rootDomain;

    try {
      await this.events.request2('deployment:contract:deploy', this.ensConfig.ENSRegistry);
    } catch (err) {
      this.logger.error(__(`Error deploying the ENS Registry contract: ${err.message}`));
      this.logger.debug(err.stack);
    }
    // Add Resolver to contract manager again but this time with correct arguments (Registry address)
    this.ensConfig.Resolver.args = [this.ensConfig.ENSRegistry.deployedAddress];
    this.ensConfig.Resolver = await this.events.request2('contracts:add', this.ensConfig.Resolver);
    try {
      await this.events.request2('deployment:contract:deploy', this.ensConfig.Resolver);
    } catch (err) {
      this.logger.error(__(`Error deploying the ENS Resolver contract: ${err.message}`));
      this.logger.debug(err.stack);
    }

    const config = {
      registryAbi: self.ensConfig.ENSRegistry.abiDefinition,
      registryAddress: self.ensConfig.ENSRegistry.deployedAddress,
      resolverAbi: self.ensConfig.Resolver.abiDefinition,
      resolverAddress: self.ensConfig.Resolver.deployedAddress
    };

    self.ensContract = new web3.eth.Contract(config.registryAbi, config.registryAddress);
    self.resolverContract = new web3.eth.Contract(config.resolverAbi, config.resolverAddress);

    async.waterfall([
      function checkRootNode(next) {
        if (!doRegister) {
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
            config.registrarAbi = self.ensConfig.FIFSRegistrar.abiDefinition;
            config.registrarAddress = self.ensConfig.FIFSRegistrar.deployedAddress;
            self.registrarContract = new web3.eth.Contract(config.registrarAbi, config.registrarAddress);
            return next(err);
          });
        });
      },
      function registerRoot(next) {
        async function send() {
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
    ], async (err) => {
      self.configured = true;
      if (err && err !== NO_REGISTRATION) {
        self.logger.error('Error while deploying ENS contracts');
        self.logger.error(err.message || err);
        return cb(err);
      }
      self.ensAPI.registerAPIs();
      self.setProviderAndRegisterDomains(cb);
    });
  }

  modifyENSArguments(params, callback) {
    const self = this;

    checkArgs(params.contract.args, (err, args) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = args;
      callback(null, params);
    });

    function checkArgs(args, done) {
      if (typeof args === 'function') {
        return done(null, args);
      }
      if (Array.isArray(args)) {
        async.map(args, (arg, next) => {
          if (Array.isArray(arg)) {
            return checkArgs(arg, next);
          }

          if (!self.isENSName(arg)) {
            return next(null, arg);
          }

          self.ensResolve(arg,  (err, address) => {
            if (err) {
              return next(err);
            }
            next(null, address);
          });
        }, done);
      } else {
        let updatedArgs = {};
        async.each(Object.keys(args), (key, next) => {
          const arg = args[key];
          if (Array.isArray(arg)) {
            return checkArgs(arg, (err, values) => {
              updatedArgs[key] = values;
              next(null);
            });
          }
          if (!self.isENSName(arg)) {
            updatedArgs[key] = arg;
            return next(null);
          }
          self.ensResolve(arg, (err, address) => {
            if (err) {
              return next(err);
            }
            updatedArgs[key] = address;
            next(null);
          });
        }, err => {
          if (err) {
            return done(err);
          }
          done(null, updatedArgs);
        });
      }
    }
  }

  ensResolve(name, cb) {
    if (!this.ensContract) {
      return cb(__('ENS not registered for this configuration'));
    }
    ENSFunctions.resolveName(name, this.ensContract, this.createResolverContract.bind(this), cb, namehash);
  }

  ensLookup(address, cb) {
    if (!this.ensContract) {
      return cb(__('ENS not registered for this configuration'));
    }
    ENSFunctions.lookupAddress(address, this.ensContract, namehash, this.createResolverContract.bind(this), cb);
  }

  async ensRegisterSubdomain(subdomain, address, cb) {
    const defaultAccount = await this.web3DefaultAccount;
    this.safeRegisterSubDomain(subdomain, address, defaultAccount, cb);
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
