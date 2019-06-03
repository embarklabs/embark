import {recursiveMerge} from "embark-utils";

const constants = require('embark-core/constants');

export function getBlockchainDefaults(env) {
  return {
    default: {
      enabled: true,
      client: constants.blockchain.clients.geth,
      proxy: true,
      datadir: `.embark/${env}/datadir`,
      rpcHost: "localhost",
      rpcPort: 8545,
      rpcCorsDomain: {
        auto: true,
        additionalCors: []
      },
      wsRPC: true,
      wsOrigins: {
        auto: true,
        additionalCors: []
      },
      wsHost: "localhost",
      wsPort: 8546,
      networkType: "custom",
      isDev: false,
      mineWhenNeeded: false,
      nodiscover: true,
      maxpeers: 0,
      targetGasLimit: 8000000,
      simulatorBlocktime: 0
    }
  };
}

export function getContractDefaults(embarkConfigVersions) {
  const defaultVersions = {
    "web3": "1.0.0-beta",
    "solc": "0.5.0"
  };
  const versions = recursiveMerge(defaultVersions, embarkConfigVersions || {});

  return {
    "default": {
      "versions": versions,
      "dappConnection": [
        "$WEB3",
        "localhost:8545"
      ],
      "dappAutoEnable": true,
      "strategy": constants.deploymentStrategy.implicit,
      "gas": "auto",
      "deploy": {
      }
    }
  };
}
