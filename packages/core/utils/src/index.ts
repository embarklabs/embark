const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const shelljs = require('shelljs');
const clipboardy = require('clipboardy');

import * as Serialize from './serialize';
export { Serialize };
import { __ } from 'embark-i18n';

import { canonicalHost } from './host';
import * as findUp from 'find-up';
import * as fs from 'fs-extra';
export { canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker } from './host';
export { downloadFile, findNextPort, getJson, httpGet, httpsGet, httpGetJson, httpsGetJson, pingEndpoint } from './network';
export { testRpcWithEndpoint, testWsEndpoint } from './check';
const logUtils = require('./log-utils');
export const escapeHtml = logUtils.escapeHtml;
export const normalizeInput = logUtils.normalizeInput;
export { LogHandler } from './logHandler';
const toposortGraph = require('./toposort');
import * as AddressUtils from './addressUtils';
export { AddressUtils };
import { unitRegex } from './constants';
export { unitRegex } from './constants';
import { isHex, getWeiBalanceFromString } from './web3Utils';
export {
  decodeParams,
  isHex,
  getHexBalanceFromString,
  getWeiBalanceFromString,
  hexToNumber,
  sha3,
  sha512,
  soliditySha3,
  toChecksumAddress
} from './web3Utils';
import LongRunningProcessTimer from './longRunningProcessTimer';
export { LongRunningProcessTimer };
import AccountParser from './accountParser';
export { AccountParser };
export {
  anchoredValue,
  dappPath,
  diagramPath,
  embarkPath,
  ipcPath,
  joinPath,
  pkgPath,
  tmpDir,
  urlJoin,
  PWD,
  DAPP_PATH,
  DIAGRAM_PATH,
  EMBARK_PATH,
  PKG_PATH,
  NODE_PATH,
  normalizePath,
  toForwardSlashes
} from './pathUtils';
export { setUpEnv, isDebug } from './env';

import {
  dappPath
} from './pathUtils';

const { extendZeroAddressShorthand, replaceZeroAddressShorthand } = AddressUtils;

export { compact, last, recursiveMerge, groupBy } from './collections';
export { prepareForCompilation } from './solidity/remapImports';
export { File, getExternalContractUrl, Types, getAppendLogFileCargo, getCircularReplacer, readAppendedLogs } from './file';

export {
  findMonorepoPackageFromRoot,
  findMonorepoPackageFromRootSync,
  isInsideMonorepo,
  isInsideMonorepoSync,
  monorepoRootPath,
  monorepoRootPathSync
} from './monorepo';

export function timer(ms: number) {
  const then = Date.now();
  return new Promise(resolve => (
    setTimeout(() => resolve(Date.now() - then), ms)
  ));
}

export function checkIsAvailable(url: string, callback: (isAvailable: boolean) => void) {
  const protocol = url.split(':')[0];
  const httpObj = (protocol === 'https') ? https : http;

  httpObj
    .get(url, (_res: any) => callback(true))
    .on('error', (_res: any) => callback(false));
}

export function hashTo32ByteHexString(hash: string) {
  if (isHex(hash)) {
    if (!hash.startsWith('0x')) {
      hash = '0x' + hash;
    }
    return hash;
  }
  const multihash = require('multihashes');
  const buf = multihash.fromB58String(hash);
  const digest = multihash.decode(buf).digest;
  return '0x' + multihash.toHexString(digest);
}

export function exit(code: number) {
  process.exit(code);
}

export function runCmd(cmd: string, options: any, callback: any) {
  options = Object.assign({silent: true, exitOnError: true, async: true}, options || {});
  const outputToConsole = !options.silent;
  options.silent = true;
  const result = shelljs.exec(cmd, options, (code, stdout: string) => {
    if (code !== 0) {
      if (options.exitOnError) {
        return exit(code);
      }
      if (typeof callback === 'function') {
        callback(`shell returned code ${code}`);
      }
    } else {
      if (typeof callback === 'function') {
        return callback(null, stdout);
      }
    }
  });

  result.stdout.on('data', (data: any) => {
    if (outputToConsole) {
      console.log(data);
    }
  });

  result.stderr.on('data', (data: any) => {
    if (outputToConsole) {
      console.log(data);
    }
  });
}

export function copyToClipboard(text: string) {
  clipboardy.writeSync(text);
}

export function byName(a, b) {
  return a.name.localeCompare(b.name);
}

export function isFolder(node) {
  return node.children && node.children.length;
}

export function isNotFolder(node) {
  return !isFolder(node);
}

export function fileTreeSort(nodes) {
  const folders = nodes.filter(isFolder).sort(byName);
  const files = nodes.filter(isNotFolder).sort(byName);

  return folders.concat(files);
}

export function proposeAlternative(word, _dictionary, _exceptions) {
  const propose = require('propose');
  const exceptions = _exceptions || [];
  const dictionary = _dictionary.filter((entry) => {
    return exceptions.indexOf(entry) < 0;
  });
  return propose(word, dictionary, {threshold: 0.3});
}

export function toposort(graph) {
  return toposortGraph(graph);
}

export function deconstructUrl(endpoint) {
  const matches = endpoint.match(/(wss?|https?):\/\/([a-zA-Z0-9_.\/-]*):?([0-9]*)?/);
  return {
    protocol: matches[1],
    host: matches[2],
    port: matches[3] ? parseInt(matches[3], 10) : false,
    type: matches[1] === 'ws' || matches[1] === 'wss' ? 'ws' : 'rpc'
  };
}

export function prepareContractsConfig(config) {
  if (config.deploy) {
    config.contracts = config.deploy;
    delete config.deploy;
  }
  Object.keys(config.contracts).forEach((contractName) => {
    const gas = config.contracts[contractName].gas;
    const gasPrice = config.contracts[contractName].gasPrice;
    const address = config.contracts[contractName].address;
    const args = config.contracts[contractName].args;
    const onDeploy = config.contracts[contractName].onDeploy;

    if (gas && gas.toString().match(unitRegex)) {
      config.contracts[contractName].gas = getWeiBalanceFromString(gas);
    }

    if (gasPrice && gasPrice.toString().match(unitRegex)) {
      config.contracts[contractName].gasPrice = getWeiBalanceFromString(gasPrice);
    }

    if (address && typeof address === 'string') {
      config.contracts[contractName].address = extendZeroAddressShorthand(address);
    }

    if (typeof args === 'function') {
      config.contracts[contractName].args = args;
    }

    if (args && Array.isArray(args)) {
      config.contracts[contractName].args = args.map((val) => {
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

export function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }

  return value;
}

export function fuzzySearch(text, list, filter) {
  const fuzzy = require('fuzzy');
  return fuzzy.filter(text, list, {
    extract: filter
  });
}

/**
 * Builds a URL
 *
 * @param {string} protocol
 *  The URL protocol, defaults to http.
 * @param {string} host
 *  The URL host, required.
 * @param {string} port
 *  The URL port, default to empty string.
 * @param {string} [type]
 *  Type of connection
 * @returns {string} the constructued URL, with defaults
 */
export function buildUrl(protocol, host, port, type) {
  if (!host) {
    throw new Error('utils.buildUrl: parameter \'host\' is required');
  }
  if (port) {
    port = ':' + port;
  } else {
    port = '';
  }
  if (!protocol) {
    protocol = type === 'ws' ? 'ws' : 'http';
  }
  return `${protocol}://${host}${port}`;
}

/**
 * Builds a URL
 *
 * @param {object} configObj Object containing protocol, host, and port to be used to construct the url.
 *      * protocol      {String}    (optional) The URL protocol, defaults to http.
 *      * host          {String}    (required) The URL host.
 *      * port          {String}    (optional) The URL port, default to empty string.
 * @returns {string} the constructued URL, with defaults
 */
export function buildUrlFromConfig(configObj) {
  if (!configObj) {
    throw new Error('[utils.buildUrlFromConfig]: config object must cannot be null');
  }
  if (!configObj.host) {
    throw new Error('[utils.buildUrlFromConfig]: object must contain a \'host\' property');
  }
  return buildUrl(configObj.protocol, canonicalHost(configObj.host), configObj.port, configObj.type);
}

export function errorMessage(e) {
  if (typeof e === 'string') {
    return e;
  } else if (e && e.message) {
    return e.message;
  }
  return e;
}

export function isConstructor(obj) {
  return !!obj.prototype && !!obj.prototype.constructor.name;
}

export function isEs6Module(module) {
  return (typeof module === 'function' && isConstructor(module)) || (typeof module === 'object' && typeof module.default === 'function' && module.__esModule);
}

export function warnIfPackageNotDefinedLocally(packageName, warnFunc, embarkConfig) {
  const packageIsResolvable = findUp.sync("node_modules/" + packageName, {cwd: dappPath()});
  if (!packageIsResolvable) {
    return warnFunc("== WARNING: "  + packageName + " could not be resolved; ensure it is defined in your dapp's package.json dependencies and then run npm or yarn install; in future versions of embark this package should be a local dependency and configured as a plugin");
  }

  const dappPackage = fs.readJSONSync(dappPath("package.json"));
  const { dependencies, devDependencies } = dappPackage;
  if (!((dependencies && dependencies[packageName]) || (devDependencies && devDependencies[packageName]))) {
    return warnFunc("== WARNING: it seems "  + packageName + " is not defined in your dapp's package.json dependencies; In future versions of embark this package should be a local dependency and configured as a plugin");
  }

  if (!embarkConfig.plugins[packageName]) {
    return warnFunc(
      __("== WARNING: it seems %s is not defined in your Dapp's embark.json plugins;\nIn future versions of Embark, this package should be a local dependency and configured as a plugin", packageName)
    );
  }

  return true;
}
