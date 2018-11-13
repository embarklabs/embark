const { http, https } = require("follow-redirects");
const {canonicalHost} = require("./host");

declare const __: any;

const balanceRegex = /([0-9]+) ?([a-zA-Z]*)/;

function joinPath() {
  const path = require("path");
  return path.join.apply(path.join, arguments);
}

function dirname() {
  const path = require("path");
  return path.dirname.apply(path.dirname, arguments);
}

function filesMatchingPattern(files: any[]) {
  const globule = require("globule");
  return globule.find(files, {nonull: true});
}

function fileMatchesPattern(patterns: any, intendedPath: any) {
  const globule = require("globule");
  return globule.isMatch(patterns, intendedPath);
}

function recursiveMerge(target: object, source: object) {
  const merge = require("merge");
  return merge.recursive(target, source);
}

function checkIsAvailable(url: string, callback: any) {
  http.get(url, (res: any) => {
    callback(true);
  }).on("error", (res: any) => {
    callback(false);
  });
}

function httpGetRequest(httpObj: any, url: string, callback: any) {
  httpObj.get(url, (res: any) => {
    let body = "";
    res.on("data", (d: string) => {
      body += d;
    });
    res.on("end", () => {
      callback(null, body);
    });
  }).on("error", (err: any) => {
    callback(err);
  });
}

function httpGet(url: string, callback: any) {
  httpGetRequest(http, url, callback);
}

function httpsGet(url: string, callback: any) {
  httpGetRequest(https, url, callback);
}

function httpGetJson(url: string, callback: any) {
  httpGetRequest(http, url, (err: any, body: string) => {
    try {
      const parsed = JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

function httpsGetJson(url: string, callback: any) {
  httpGetRequest(https, url, (err: any, body: string) => {
    try {
      const parsed = JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

function getJson(url: string, cb: any) {
  if (url.indexOf("https") === 0) {
    return httpsGetJson(url, cb);
  }
  httpGetJson(url, cb);
}

function pingEndpoint(host: string, port: any, type: any, protocol: any, origin: any, callback: any) {
  const options: any = {
    host,
    origin,
    perMessageDeflate: true,
    port,
    protocolVersion: 13,
  };
  if (type === "ws") {
    options.headers = {
      "Connection": "Upgrade",
      "Origin": origin,
      "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
      "Sec-WebSocket-Version": 13,
      "Upgrade": "websocket",
    };
  }
  let req;
  // remove trailing api key from infura, ie rinkeby.infura.io/nmY8WtT4QfEwz2S7wTbl
  if (options.host.indexOf("/") > -1) {
    options.host = options.host.split("/")[0];
  }
  if (protocol === "https") {
    req = require("https").get(options);
  } else {
    req = require("http").get(options);
  }

  req.on("error", (err: any) => {
    callback(err);
  });

  req.on("response", (response: any) => {
    callback();
  });

  req.on("upgrade", (res: any, socket: any, head: any) => {
    callback();
  });
}

function runCmd(cmd: string, options: any, callback: any) {
  const shelljs = require("shelljs");
  options = Object.assign({silent: true, exitOnError: true, async: true}, options || {});
  const outputToConsole = !options.silent;
  options.silent = true;
  const result = shelljs.exec(cmd, options, (code: number, stdout: string) => {
    if (code !== 0) {
      if (options.exitOnError) {
        return exit();
      }
      if (typeof callback === "function") {
        callback(`shell returned code ${code}`);
      }
    } else {
      if (typeof callback === "function") {
        return callback(null, stdout);
      }
    }
  });

  result.stdout.on("data", (data: any) => {
    if (outputToConsole) {
      console.log(data);
    }
  });

  result.stderr.on("data", (data: any) => {
    if (outputToConsole) {
      console.log(data);
    }
  });
}

function cd(folder: string) {
  const shelljs = require("shelljs");
  shelljs.cd(folder);
}

function sed(file: any, pattern: any, replace: any) {
  const shelljs = require("shelljs");
  shelljs.sed("-i", pattern, replace, file);
}

function exit(code?: number) {
  process.exit(code);
}

function downloadFile(url: string, dest: string, cb: any) {
  const o_fs = require("fs-extra");
  const file = o_fs.createWriteStream(dest);
  (url.substring(0, 5) === "https" ? https : http).get(url, (response: any) => {
    if (response.statusCode !== 200) {
      cb(`Download failed, response code ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on("finish", () => {
      file.close(cb);
    });
  }).on("error", (err?: any) => {
    o_fs.unlink(dest);
    cb(err.message);
  });
}

function extractTar(filename: string, packageDirectory: string, cb: any) {
  const o_fs = require("fs-extra");
  const tar = require("tar");
  o_fs.createReadStream(filename).pipe(
    tar.x({
      C: packageDirectory,
      strip: 1,
    }).on("end", () => {
      cb();
    })
  );
}

function extractZip(filename: string, packageDirectory: string, opts: any, cb: any) {
  const decompress = require("decompress");

  decompress(filename, packageDirectory, opts).then((files?: any) => {
    cb();
  });
}

function proposeAlternative(word: string, dictionary: string[], exceptions?: string[]) {
  const propose = require("propose");
  dictionary = dictionary.filter((entry) => {
    return (exceptions || []).indexOf(entry) < 0;
  });
  return propose(word, dictionary, {threshold: 0.3});
}

function getExternalContractUrl(file: string, providerUrl: string) {
  const constants = require("../constants");
  let url;
  const RAW_URL = "https://raw.githubusercontent.com/";
  const DEFAULT_SWARM_GATEWAY = "https://swarm-gateways.net/";
  const MALFORMED_SWARM_ERROR = "Malformed Swarm gateway URL for ";
  const MALFORMED_ERROR = "Malformed Github URL for ";
  const MALFORMED_IPFS_ERROR = "Malformed IPFS URL for ";
  const IPFS_GETURL_NOTAVAILABLE = "IPFS getUrl is not available. Please set it in your storage config. For more info: https://embark.status.im/docs/storage_configuration.html";
  if (file.startsWith("https://github")) {
    const match: any = file.match(/https:\/\/github\.[a-z]+\/(.*)/);
    if (!match) {
      // console.error(MALFORMED_ERROR + file);
      return null;
    }
    url = `${RAW_URL}${match[1].replace("blob/", "")}`;
  } else if (file.startsWith("ipfs")) {
    if (!providerUrl) {
      // console.error(IPFS_GETURL_NOTAVAILABLE);
      return null;
    }
    let match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)\/(.*)/);
    if (!match) {
      match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)/);
      if (!match) {
        // console.error(MALFORMED_IPFS_ERROR + file);
        return null;
      }
    }
    let matchResult = match[1];
    if (match[2]) {
      matchResult += "/" + match[2];
    }
    url = `${providerUrl}${matchResult}`;
    return {
      filePath: constants.httpContractsDirectory + matchResult,
      url,
    };
  } else if (file.startsWith("git")) {
    // Match values
    // [0] entire input
    // [1] git://
    // [2] user
    // [3] repository
    // [4] path
    // [5] branch
    const match = file.match(/(git:\/\/)?github\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~?\/&=]+)#?([a-zA-Z0-9\/_.-]*)?/);
    if (!match) {
      return null;
    }
    let branch = match[5];
    if (!branch) {
      branch = "master";
    }
    url = `${RAW_URL}${match[2]}/${match[3]}/${branch}/${match[4]}`;
  } else if (file.startsWith("http")) {
    url = file;
  } else if (file.startsWith("bzz")) {
    if (!providerUrl) {
      url = DEFAULT_SWARM_GATEWAY + file;
    } else {
      let match = file.match(/bzz:\/([-a-zA-Z0-9]+)\/(.*)/);
      if (!match) {
        match = file.match(/bzz:\/([-a-zA-Z0-9]+)/);
        if (!match) {
          return null;
        }
      }
      url = providerUrl + "/" + file;
    }
  } else {
    return null;
  }
  const match = url.match(/\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&\/=]+)/) || "";
  return {
    filePath: constants.httpContractsDirectory + match[1],
    url,
  };
}

function hexToNumber(hex: any) {
  const Web3 = require("web3");
  return Web3.utils.hexToNumber(hex);
}

function isHex(hex: any) {
  const Web3 = require("web3");
  return Web3.utils.isHex(hex);
}

function hashTo32ByteHexString(hash: string) {
  if (isHex(hash)) {
    if (!hash.startsWith("0x")) {
      hash = "0x" + hash;
    }
    return hash;
  }
  const multihash = require("multihashes");
  const buf = multihash.fromB58String(hash);
  const digest = multihash.decode(buf).digest;
  return "0x" + multihash.toHexString(digest);
}

function isValidDomain(domain: string) {
  const checkIsValidDomain = require("is-valid-domain");
  return checkIsValidDomain(domain);
}

function isValidEthDomain(ethDomain: string) {
  if (!isValidDomain(ethDomain)) {
    return false;
  }
  return ethDomain.substring(ethDomain.lastIndexOf("."), ethDomain.length) === ".eth";
}

function decodeParams(typesArray: any, hexString: any) {
  const Web3EthAbi = require("web3-eth-abi");
  return Web3EthAbi.decodeParameters(typesArray, hexString);
}

function toChecksumAddress(address: any) {
  const Web3 = require("web3");
  return Web3.utils.toChecksumAddress(address);
}

function sha3(arg: any) {
  const Web3 = require("web3");
  return Web3.utils.sha3(arg);
}

function soliditySha3(arg: any) {
  const Web3 = require("web3");
  return Web3.utils.soliditySha3(arg);
}

function normalizeInput(input: any) {
  if (typeof input === "string") { return input; }
  const args: any[] = Object.values(input);
  if (args.length === 0) {
    return "";
  }
  if (args.length === 1) {
    if (Array.isArray(args[0])) {
      return args[0].join(",");
    }
    return args[0] || "";
  }
  return ("[" + args.map((x) => {
    if (x === null) {
      return "null";
    }
    if (x === undefined) {
      return "undefined";
    }
    if (Array.isArray(x)) {
      return x.join(",");
    }
    return x;
  }).toString() + "]");
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
function buildUrl(protocol: string, host: string, port: string, type: string) {
  if (!host) { throw new Error("utils.buildUrl: parameter \"host\" is required"); }
  if (port) {
    port = ":" + port;
  } else {
    port = "";
  }
  if (!protocol) {
    protocol = type === "ws" ? "ws" : "http";
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
function buildUrlFromConfig(configObj?: any) {
  if (!configObj) { throw new Error("[utils.buildUrlFromConfig]: config object must cannot be null"); }
  if (!configObj.host) { throw new Error("[utils.buildUrlFromConfig]: object must contain a \"host\" property"); }
  return buildUrl(configObj.protocol, canonicalHost(configObj.host), configObj.port, configObj.type);
}

function deconstructUrl(endpoint: string) {
  const matches = endpoint.match(/(ws|https?):\/\/([a-zA-Z0-9_.-]*):?([0-9]*)?/) || "";
  return {
    host: matches[2],
    port: matches[3],
    protocol: matches[1],
    type: matches[1] === "ws" ? "ws" : "rpc",
  };
}

function getWeiBalanceFromString(balanceString: string, web3?: any) {
  if (!web3) {
    throw new Error(__("[utils.getWeiBalanceFromString]: Missing parameter \"web3\""));
  }
  if (!balanceString) {
    return 0;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__("Unrecognized balance string \"%s\"", balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(parseInt(match[1], 10));
  }

  return web3.utils.toWei(match[1], match[2]);
}

function getHexBalanceFromString(balanceString: string, web3?: any) {
  if (!web3) {
    throw new Error(__("[utils.getWeiBalanceFromString]: Missing parameter \"web3\""));
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
    return web3.utils.toHex(parseInt(match[1], 10));
  }

  return web3.utils.toHex(web3.utils.toWei(match[1], match[2]));
}

function compact(array: any[]) {
  return array.filter((n: any) => n);
}

function groupBy(array: any[], key: any) {
  return array.reduce((rv: any, x: any) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

function sample(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function last(array: any[]) {
  return array[array.length - 1];
}

function interceptLogs(consoleContext: any, logger: any) {
  const context: any = {};
  context.console = consoleContext;

  context.console.log = (...args: any[]) => {
    logger.info(normalizeInput(args));
  };
  context.console.warn = (...args: any[]) => {
    logger.warn(normalizeInput(args));
  };
  context.console.info = (...args: any[]) => {
    logger.info(normalizeInput(args));
  };
  context.console.debug = (...args: any[]) => {
    // TODO: ue JSON.stringify
    logger.debug(normalizeInput(args));
  };
  context.console.trace = (...args: any[]) => {
    logger.trace(normalizeInput(args));
  };
  context.console.dir = (...args: any[]) => {
    logger.dir(normalizeInput(args));
  };
}

function errorMessage(e: any) {
  if (typeof e === "string") {
    return e;
  } else if (e && e.message) {
    return e.message;
  }
  return e;
}

function timer(ms: number) {
  return new Promise((resolve: any) => setTimeout(resolve, ms));
}

function isFolder(node: any) {
  return node.children && node.children.length;
}

function isNotFolder(node: any) {
  return !isFolder(node);
}

function byName(a: any, b: any) {
  return a.name.localeCompare(b.name);
}

function fileTreeSort(nodes: any[]) {
  const folders = nodes.filter(isFolder).sort(byName);
  const files = nodes.filter(isNotFolder).sort(byName);

  return folders.concat(files);
}

function copyToClipboard(text: string) {
  const clipboardy = require("clipboardy");
  clipboardy.writeSync(text);
}

function fuzzySearch(text: string, list: any[], filter?: any) {
  const fuzzy = require("fuzzy");
  const cb = filter || (() => {});
  return fuzzy.filter(text, list, { extract: cb});
}

function jsonFunctionReplacer(key: any, value: any) {
  if (typeof value === "function") {
    return value.toString();
  }

  return value;
}

export default {
  dirname,
  joinPath,
  filesMatchingPattern,
  fileMatchesPattern,
  recursiveMerge,
  checkIsAvailable,
  httpGet,
  httpsGet,
  httpGetJson,
  httpsGetJson,
  getJson,
  hexToNumber,
  isHex,
  hashTo32ByteHexString,
  isValidDomain,
  isValidEthDomain,
  pingEndpoint,
  decodeParams,
  runCmd,
  cd,
  sed,
  exit,
  downloadFile,
  extractTar,
  extractZip,
  proposeAlternative,
  getExternalContractUrl,
  toChecksumAddress,
  sha3,
  soliditySha3,
  normalizeInput,
  buildUrl,
  buildUrlFromConfig,
  deconstructUrl,
  getWeiBalanceFromString,
  getHexBalanceFromString,
  compact,
  groupBy,
  sample,
  last,
  interceptLogs,
  errorMessage,
  timer,
  fileTreeSort,
  copyToClipboard,
  fuzzySearch,
  jsonFunctionReplacer,
};
