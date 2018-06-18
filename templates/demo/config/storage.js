module.exports = {
  default: {
    enabled: true,
    ipfs_bin: "ipfs",
    provider: "ipfs",
    available_providers: ["ipfs"],
    upload: {
      host: "localhost",
      port: 5001
    },
    dappConnection: [
      {
        provider:"ipfs",
        host: "localhost",
        port: 5001,
        getUrl: "http://localhost:8080/ipfs/"
      }
    ]
  },
  development: {
    enabled: true,
    provider: "ipfs",
    upload: {
      host: "localhost",
      port: 5001,
      getUrl: "http://localhost:8080/ipfs/"
    }
  }
};
