import { __ } from "embark-i18n";
const async = require("async");
const semver = require("semver");
const constants = require("embark-core/constants");

const DEFAULTS = {
  "BIN": "geth",
  "VERSIONS_SUPPORTED": ">=1.9.7",
  "NETWORK_TYPE": "custom",
  "NETWORK_ID": 1337,
  "RPC_API": ["web3"],
  "WS_API": ["web3", "shh"],
  "DEV_WS_API": ["web3", "shh"],
  "TARGET_GAS_LIMIT": 8000000
};

class WhisperGethClient {

  static get DEFAULTS() {
    return DEFAULTS;
  }

  // eslint-disable-next-line complexity
  constructor(options) {
    this.config = options && options.hasOwnProperty("config") ? options.config : {};
    this.communicationConfig = options.communicationConfig;
    this.env = options && options.hasOwnProperty("env") ? options.env : "development";
    this.isDev = options && options.hasOwnProperty("isDev") ? options.isDev : (this.env === "development");
    this.name = constants.blockchain.clients.geth;
    this.prettyName = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
    this.bin = this.config.ethereumClientBin || DEFAULTS.BIN;
    this.versSupported = DEFAULTS.VERSIONS_SUPPORTED;
    this.httpReady = false;
    this.wsReady = !this.config.wsRPC;
  }

  isReady(data) {
    if (data.indexOf("WebSocket endpoint opened") > -1) {
      this.wsReady = true;
    }
    return this.wsReady;
  }

  commonOptions() {
    return [];
  }

  getBinaryPath() {
    return this.bin;
  }

  determineVersionCommand() {
    return this.bin + " version";
  }

  parseVersion(rawVersionOutput) {
    let parsed;
    const match = rawVersionOutput.match(/Version: (.*)/);
    if (match) {
      parsed = match[1].trim();
    }
    return parsed;
  }

  isSupportedVersion(parsedVersion) {
    let test;
    try {
      let v = semver(parsedVersion);
      v = `${v.major}.${v.minor}.${v.patch}`;
      test = semver.Range(this.versSupported).test(semver(v));
      if (typeof test !== "boolean") {
        // eslint-disable-next-line no-undefined
        test = undefined;
      }
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return test;
    }
  }

  determineNetworkType(config) {
    let cmd;
    if (config.networkType === "testnet") {
      cmd = "--testnet";
    } else if (config.networkType === "rinkeby") {
      cmd = "--rinkeby";
    } else if (config.networkType === "custom") {
      cmd = "--networkid=" + config.networkId;
    }
    return cmd;
  }

  runAsArchival(config) {
    return config.networkId === 1337 || config.archivalMode;
  }

  initGenesisCommmand() {
    return "";
  }

  determineRpcOptions(config) {
    let cmd = [];
    cmd.push("--port=30304");
    cmd.push("--rpc");
    cmd.push("--rpcport=9998");
    cmd.push("--rpcaddr=" + config.rpcHost);

    if (config.rpcCorsDomain) {
      if (config.rpcCorsDomain === "*") {
        console.warn("==================================");
        console.warn(__("rpcCorsDomain set to *"));
        console.warn(__("make sure you know what you are doing"));
        console.warn("==================================");
      }
      cmd.push("--rpccorsdomain=" + config.rpcCorsDomain);
    } else {
      console.warn("==================================");
      console.warn(__("warning: cors is not set"));
      console.warn("==================================");
    }
    return cmd;
  }

  // eslint-disable-next-line complexity
  determineWsOptions(config, communicationConfig) {
    let cmd = [];
    if (config.wsRPC) {
      cmd.push("--ws");

      cmd.push(`--wsport=${communicationConfig.connection.port || config.wsPort++}`);
      cmd.push(`--wsaddr=${communicationConfig.connection.host || config.wsHost++}`);

      if (config.wsOrigins) {
        if (config.wsOrigins === "*") {
          console.warn("==================================");
          console.warn(__("wsOrigins set to *"));
          console.warn(__("make sure you know what you are doing"));
          console.warn("==================================");
        }
        cmd.push("--wsorigins=" + config.wsOrigins);
      } else {
        console.warn("==================================");
        console.warn(__("warning: wsOrigins is not set"));
        console.warn("==================================");
      }
    }
    return cmd;
  }

  initDevChain(datadir, callback) {
    callback();
  }

  mainCommand(address, done) {
    let self = this;
    let config = this.config;
    let rpcApi = this.config.rpcApi;
    let wsApi = this.config.wsApi;
    let args = ['--ipcdisable']; // Add --ipcdisable as ipc is not needed for Whisper and it conflicts on Windows with the blockchain node
    async.series([
      function commonOptions(callback) {
        let cmd = self.commonOptions();
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function wsOptions(callback) {
        let cmd = self.determineWsOptions(self.config, self.communicationConfig);
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function dontGetPeers(callback) {
        if (config.nodiscover) {
          args.push("--nodiscover");
          return callback(null, "--nodiscover");
        }
        callback(null, "");
      },
      function maxPeers(callback) {
        let cmd = "--maxpeers=" + config.maxpeers;
        args.push(cmd);
        callback(null, cmd);
      },
      function bootnodes(callback) {
        if (config.bootnodes && config.bootnodes !== "" && config.bootnodes !== []) {
          args.push("--bootnodes=" + config.bootnodes);
          return callback(null, "--bootnodes=" + config.bootnodes);
        }
        callback("");
      },
      function whisper(callback) {
        rpcApi.push("shh");
        if (wsApi.indexOf("shh") === -1) {
          wsApi.push("shh");
        }
        args.push("--shh");
        return callback(null, "--shh ");
      },
      function rpcApiArgs(callback) {
        args.push("--rpcapi=" + rpcApi.join(","));
        callback(null, "--rpcapi=" + rpcApi.join(","));
      },
      function wsApiArgs(callback) {
        args.push("--wsapi=" + wsApi.join(","));
        callback(null, "--wsapi=" + wsApi.join(","));
      }
    ], function (err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.bin, args);
    });
  }
}

module.exports = WhisperGethClient;
