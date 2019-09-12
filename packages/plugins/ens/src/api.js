import {__} from 'embark-i18n';
import ensJS from 'embarkjs-ens';

const ENSFunctions = ensJS.ENSFunctions;
const namehash = require('eth-ens-namehash');

class ensAPI {
  constructor(embark, options) {
    this.embark = embark;
    this.ens = options.ens;
  }

  registerAPIs() {
    this.embark.registerAPICall(
      'get',
      '/embark-api/ens/resolve',
      (req, res) => {
        ENSFunctions.resolveName(req.query.name, this.ens.ensContract, this.ens.createResolverContract.bind(this.ens), (error, address) => {
          if (error) {
            return res.send({error: error.message || error});
          }
          res.send({address});
        }, namehash);
      });

    this.embark.registerAPICall(
      'get',
      '/embark-api/ens/lookup',
      (req, res) => {
        ENSFunctions.lookupAddress(req.query.address, this.ens.ensContract, namehash, this.ens.createResolverContract.bind(this.ens), (error, name) => {
          if (error) {
            return res.send({error: error.message || error});
          }
          res.send({name});
        });
      });

    this.embark.registerAPICall(
      'post',
      '/embark-api/ens/register',
      (req, res) => {
        const {subdomain, address} = req.body;
        this.ens.ensRegisterSubdomain(subdomain, address, (error) => {
          if (error) {
            return res.send({error: error.message || error});
          }
          res.send({
            name: `${req.body.subdomain}.${this.embark.config.namesystemConfig.register.rootDomain}`,
            address: req.body.address
          });
        });
      }
    );
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      usage: 'resolve [name]',
      description: __('Resolves an ENS name'),
      matches: (cmd) => cmd.split(' ')[0] === 'resolve',
      process: (cmd, cb) => {
        const [_cmdName, name] = cmd.split(' ');
        ENSFunctions.resolveName(name, this.ens.ensContract, this.ens.createResolverContract.bind(this.ens), cb, namehash);
      }
    });

    this.embark.registerConsoleCommand({
      usage: 'lookup [address]',
      description: __('Lookup an ENS address'),
      matches: (cmd) => cmd.split(' ')[0] === 'lookup',
      process: (cmd, cb) => {
        const [_cmdName, address] = cmd.split(' ');
        ENSFunctions.lookupAddress(address, this.ens.ensContract, namehash, this.ens.createResolverContract.bind(this.ens), cb);
      }
    });


    this.embark.registerConsoleCommand({
      usage: 'registerSubDomain [subDomain] [address]',
      description: __('Register an ENS sub-domain'),
      matches: (cmd) => cmd.split(' ')[0] === 'registerSubDomain',
      process: (cmd, cb) => {
        const [_cmdName, name, address] = cmd.split(' ');
        this.embark.events.request("blockchain:defaultAccount:get", (_err, defaultAccount) => {
          this.ens.safeRegisterSubDomain(name, address, defaultAccount, cb);
        });
      }
    });
  }
}

module.exports = ensAPI;
