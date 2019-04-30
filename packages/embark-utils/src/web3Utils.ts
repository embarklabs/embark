import { __ } from "i18n";
import { balanceRegex } from "./constants";
const Web3EthAbi = require("web3-eth-abi");
const Web3 = require("web3");

export function getHexBalanceFromString(balanceString: string, web3: any) {
  if (!web3) {
    throw new Error(__("[getHexBalanceFromString]: Missing parameter 'web3'"));
  }
  if (!balanceString) {
    return 0xFFFFFFFFFFFFFFFFFF;
  }
  if (web3.utils.isHexStrict(balanceString)) {
    return balanceString;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__("Unrecognized balance string \"%s\"", balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(match[1]);
  }

  return web3.utils.toHex(web3.utils.toWei(match[1], match[2]));
}

export function getWeiBalanceFromString(balanceString: string, web3: any) {
  if (!web3) {
    throw new Error(__("[getWeiBalanceFromString]: Missing parameter 'web3'"));
  }
  if (!balanceString) {
    return 0;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__("Unrecognized balance string \"%s\"", balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(match[1]);
  }

  return web3.utils.toWei(match[1], match[2]);
}

export function decodeParams(typesArray: any, hexString: string) {
  return Web3EthAbi.decodeParameters(typesArray, hexString);
}

export function sha3(arg: any) {
  return Web3.utils.sha3(arg);
}
