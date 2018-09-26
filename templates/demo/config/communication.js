module.exports = {
  // default applies to all environments
  default: {
    enabled: true,
    provider: "whisper", // Communication provider. Currently, Embark only supports whisper
    available_providers: ["whisper"], // Array of available providers
  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run`
  development: {
    connection: {
      host: "localhost", // Host of the blockchain node
      port: 8546, // Port of the blockchain node
      type: "ws" // Type of connection (ws or rpc)
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
  // "embark run custom_name"
  //custom_name: {
  //}
};
