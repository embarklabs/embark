import { __ } from "embark-i18n";
import { balanceRegex } from "./constants";
const Web3EthAbi = require("web3-eth-abi");
const web3 = require("web3");

export function getHexBalanceFromString(balanceString: string) {
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

export function getWeiBalanceFromString(balanceString: string) {
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
  return web3.utils.sha3(arg);
}

export function sha512(arg: string) {
  if (typeof arg !== "string") {
    throw new TypeError("argument must be a string");
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("sha512");
  return hash.update(arg).digest("hex");
}

export function isHex(hex: string) {
  return web3.utils.isHex(hex);
}

export function soliditySha3(arg: any) {
  return web3.utils.soliditySha3(arg);
}

export function toChecksumAddress(address: any) {
  return web3.utils.toChecksumAddress(address);
}

export function hexToNumber(hex: string) {
  return web3.utils.hexToNumber(hex);
}
