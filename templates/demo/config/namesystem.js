module.exports = {
  // default applies to all environments
  default: {
    enabled: true,
    available_providers: ["ens"],
    provider: "ens"
  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run`
  development: {
    register: {
      rootDomain: "eth",
      subdomains: {
        'embark': '0x1a2f3b98e434c02363f3dac3174af93c1d690914'
      }
    }
  },

  // merges with the settings in default
  // used with "embark run privatenet"
  privatenet: {
  },

  // merges with the settings in default
  // used with "embark run testnet"
  testnet: {
  },

  // merges with the settings in default
  // used with "embark run livenet"
  livenet: {
  },

  // you can name an environment with specific settings and then specify with
  // "embark run custom_name" or "embark blockchain custom_name"
  //custom_name: {
  //}
};
