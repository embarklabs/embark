const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');

class ENS {
  constructor(embark, _options) {
    const self = this;
    this.logger = embark.logger;
    this.events = embark.events;
    this.namesConfig = embark.config.namesystemConfig;
    this.embark = embark;
    this.ensRegistry = null;
    this.ensResolver = null;

    this.addENSToEmbarkJS();
    this.configureENSRegistry();
    self.embark.registerActionForEvent("contracts:deploy:afterAll", (cb) => {      
      self.events.request('contracts:contract', "ENSRegistry", (contract) => {
        let config = {
          abi: contract.abiDefinition, 
          address: contract.deployedAddress
        };
        self.addSetProvider(config);
        return cb();
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
    self.events.request("version:get:eth-ens-namehash", function(EnsNamehashVersion) {
      let currentEnsNamehashVersion = require('../../../package.json').dependencies["eth-ens-namehash"];
      if (EnsNamehashVersion !== currentEnsNamehashVersion) {
        self.events.request("version:getPackageLocation", "eth-ens-namehash", EnsNamehashVersion, function(err, location) {
          self.embark.registerImportFile("eth-ens-namehash", fs.dappPath(location));
        });
      }
    });

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Names.registerProvider('ens', __embarkENS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  configureENSRegistry() {
    const self = this;
    self.embark.registerContractConfiguration({
      "default": {
        "gas": "auto",
        "ENSRegistry": {
          "deploy": true,
          "args": []
        }
      },
      "ropsten": {
        "ENSRegistry": {
          "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
          "args": []
        }
      },
      "rinkeby": {
        "ENSRegistry": {
          "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A",
          "args": []
        }
      },
      "livenet": {
        "ENSRegistry": {
          "address": "0x314159265dd8dbb310642f98f50c066173c1259b",
          "args": []
        }
      }
    });
    self.embark.events.request("config:contractsFiles:add", self.embark.pathToFile('./contracts/ENSRegistry.sol'));
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
