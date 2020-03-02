import { Embark } from "embark-core";
import Web3 from "web3";
import { AbiCoder as EthersAbi } from 'ethers/utils/abi-coder';
import quorumjs from "quorum-js";

// Create an augmentation for "web3-utils
declare module "web3-utils" {
  // Augment the 'web3-utils' class definition with interface merging
  interface Utils {
    _: any;
    BN: any;
  }
}

export class QuorumWeb3Extensions {

  constructor(private embark: Embark) {
  }

  registerOverrides() {
    return new Promise((resolve) => {
      this.embark.registerActionForEvent<Web3>("runcode:register:web3", (web3: Web3, cb) => {
        web3 = extendWeb3(web3);
        cb(null, web3);
        resolve();
      });
    });
  }
}

export function extendWeb3(web3: Web3) {
  quorumjs.extend(web3);
  web3 = getBlock(web3);
  web3 = getTransaction(web3);
  web3 = getTransactionReceipt(web3);
  web3 = decodeParameters(web3);
  return web3;
}

// The ts-ignores are ignoring the checks that are
// saying that web3.eth.getBlock is a function and doesn't
// have a `method` property, which it does
export function getBlock(web3: Web3) {
  // @ts-ignore
  const _oldBlockFormatter = web3.eth.getBlock.method.outputFormatter;
  // @ts-ignore
  web3.eth.getBlock.method.outputFormatter = (block: any) => {
    const _oldTimestamp = block.timestamp;
    const _oldGasLimit = block.gasLimit;
    const _oldGasUsed = block.gasUsed;

    // Quorum uses nanoseconds instead of seconds in timestamp
    let timestamp = new Web3.utils.BN(block.timestamp.slice(2), 16);
    timestamp = timestamp.div(Web3.utils.toBN(10).pow(Web3.utils.toBN(9)));

    block.timestamp = "0x" + timestamp.toString(16);

    // Since we're overwriting the gasLimit/Used later,
    // it doesn't matter what it is before the call
    // The same applies to the timestamp, but I reduced
    // the precision since there was an accurate representation
    // We do this because Quorum can have large block/transaction
    // gas limits
    block.gasLimit = "0x0";
    block.gasUsed = "0x0";

    // @ts-ignore
    const result = _oldBlockFormatter.call(web3.eth.getBlock.method, block);

    // Perhaps there is a better method of doing this,
    // but the raw hexstrings work for the time being
    result.timestamp = _oldTimestamp;
    result.gasLimit = _oldGasLimit;
    result.gasUsed = _oldGasUsed;

    return result;
  };
  return web3;
}

export function getTransaction(web3: Web3) {
  const _oldTransactionFormatter =
    // @ts-ignore
    web3.eth.getTransaction.method.outputFormatter;

  // @ts-ignore
  web3.eth.getTransaction.method.outputFormatter = (tx) => {
    const _oldGas = tx.gas;

    tx.gas = "0x0";

    const result = _oldTransactionFormatter.call(
      // @ts-ignore
      web3.eth.getTransaction.method,
      tx
    );

    // Perhaps there is a better method of doing this,
    // but the raw hexstrings work for the time being
    result.gas = _oldGas;

    return result;
  };
  return web3;
}

export function getTransactionReceipt(web3: Web3) {
  const _oldTransactionReceiptFormatter =
    // @ts-ignore
    web3.eth.getTransactionReceipt.method.outputFormatter;

  // @ts-ignore
  web3.eth.getTransactionReceipt.method.outputFormatter = (receipt: any) => {
    const _oldGasUsed = receipt.gasUsed;

    receipt.gasUsed = "0x0";

    const result = _oldTransactionReceiptFormatter.call(
      // @ts-ignore
      web3.eth.getTransactionReceipt.method,
      receipt
    );

    // Perhaps there is a better method of doing this,
    // but the raw hexstrings work for the time being
    result.gasUsed = _oldGasUsed;

    return result;
  };
  return web3;
}

// The primary difference between this decodeParameters function and web3's
// is that the 'Out of Gas?' zero/null bytes guard has been removed and any
// falsy bytes are interpreted as a zero value.
export function decodeParameters(web3: Web3) {
  const _oldDecodeParameters = web3.eth.abi.decodeParameters;

  const ethersAbiCoder = new EthersAbi((type, value) => {
    if (
      type.match(/^u?int/) &&
      !Web3.utils._.isArray(value) &&
      (!Web3.utils._.isObject(value) || value.constructor.name !== "BN")
    ) {
      return value.toString();
    }
    return value;
  });

  // result method
  function Result() { }

  web3.eth.abi.decodeParameters = (outputs: any[], bytes: string) => {
    // if bytes is falsy, we'll pass 64 '0' bits to the ethers.js decoder.
    // the decoder will decode the 64 '0' bits as a 0 value.
    if (!bytes) {
      bytes = "0".repeat(64);
    }
    const res = ethersAbiCoder.decode(
      // @ts-ignore 'mapTypes' not existing on type 'ABI'
      web3.eth.abi.mapTypes(outputs),
      `0x${bytes.replace(/0x/i, "")}`
    );
    // @ts-ignore complaint regarding Result method
    const returnValue = new Result();
    returnValue.__length__ = 0;

    outputs.forEach((output, i) => {
      let decodedValue = res[returnValue.__length__];
      decodedValue = decodedValue === "0x" ? null : decodedValue;

      returnValue[i] = decodedValue;

      if (Web3.utils._.isObject(output) && output.name) {
        returnValue[output.name] = decodedValue;
      }

      returnValue.__length__++;
    });

    return returnValue;
  };
  return web3;
}
