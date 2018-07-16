module.exports = {
  default: {
    enabled: true,
    provider: "whisper", // Communication provider. Currently, Embark only supports whisper
    available_providers: ["whisper"], // Array of available providers
    connection: {
      host: "localhost", // Host of the blockchain node
      port: 8546, // Port of the blockchain node
      type: "ws" // Type of connection (ws or rpc)
    }
  }
};

