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
    // Use this section when you need a specific symmetric or private keys in whisper
    /*
    ,keys: {
      symmetricKey: "your_symmetric_key",// Symmetric key for message decryption
      privateKey: "your_private_key" // Private Key to be used as a signing key and for message decryption
    }
    */
  }
};
