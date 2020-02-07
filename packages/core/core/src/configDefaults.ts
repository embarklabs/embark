import {recursiveMerge} from "embark-utils";
import { readJsonSync } from 'fs-extra';
import { join } from "path";

const constants = readJsonSync(join(__dirname, '../constants.json'));

export function getBlockchainDefaults(env) {
  const defaults = {
    clientConfig: {
      miningMode: 'dev' // Mode in which the node mines. Options: dev, auto, always, off
    },
    enabled: true,
    client: constants.blockchain.clients.ganache,
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
    isDev: true,
    nodiscover: true,
    maxpeers: 0,
    targetGasLimit: 8000000,
    simulatorBlocktime: 0
  };
  return {
    default: defaults,
    test: defaults
  };
}

export function getContractDefaults(embarkConfigVersions) {
  const defaultVersions = {
    solc: "0.6.1"
  };
  const versions = recursiveMerge(defaultVersions, embarkConfigVersions || {});

  return {
    default: {
      library: "embarkjs",
      versions,
      dappConnection: [
        "$WEB3",
        "ws://localhost:8546",
        "localhost:8545"
      ],
      dappAutoEnable: true,
      strategy: constants.deploymentStrategy.implicit,
      gas: "auto",
      deploy: {
      }
    }
  };
}
