import { extendZeroAddressShorthand, replaceZeroAddressShorthand } from "./addressUtils";
import { unitRegex } from "./regexConstants";

const web3 = require("web3");
const utils = require("./utils.js");

export function prepare(config: any) {
  Object.keys(config.contracts).forEach((contractName) => {
    const gas = config.contracts[contractName].gas;
    const gasPrice = config.contracts[contractName].gasPrice;
    const address = config.contracts[contractName].address;
    const args = config.contracts[contractName].args;
    const onDeploy = config.contracts[contractName].onDeploy;

    if (gas && gas.match(unitRegex)) {
      config.contracts[contractName].gas = utils.getWeiBalanceFromString(gas, web3);
    }

    if (gasPrice && gasPrice.match(unitRegex)) {
      config.contracts[contractName].gasPrice = utils.getWeiBalanceFromString(gasPrice, web3);
    }

    if (address) {
      config.contracts[contractName].address = extendZeroAddressShorthand(address);
    }

    if (args && args.length) {
      config.contracts[contractName].args = args.map((val: any) => {
        if (typeof val === "string") {
          return extendZeroAddressShorthand(val);
        }
        return val;
      });
    }

    if (Array.isArray(onDeploy)) {
      config.contracts[contractName].onDeploy = onDeploy.map(replaceZeroAddressShorthand);
    }
  });

  return config;
}
