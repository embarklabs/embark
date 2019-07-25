import { Callback, Environment } from "embark";
import { BaseBlockchainClientOptions, BlockchainClientDefaults, Config } from "../index";
const semver = require("semver");

const NOT_IMPLEMENTED_EXCEPTION = "This method has not been implemented";

/**
 * Base blockchain client. Extend this class in your custom blockchain client.
 */
export class BaseBlockchainClient {
  /**
   * Blockchain client config
   */
  protected config: Config;
  /**
   * The current runtime environment of Embark, set by running `embark run <environment>`.
   */
  protected env: Environment;
  /**
   * Determined by whether the current runtime environment is development or not.
   */
  protected isDev: boolean;

  /**
   * Default client configuration options
   */
  public defaults: BlockchainClientDefaults = {
    bin: "",
    devWsApi: [],
    networkType: "custom",
    rpcApi: [],
    wsApi: [],
  };
  /**
   * Name of blockchain client - used in the blockchain config "client" property
   */
  public name: string = "baseclient";
  /**
   * Pretty name of blockchain client
   */
  public prettyName: string = "Base blockchain client";
  /**
   * Mimimum client version supported, ie ">=1.3.0"
   */
  public versSupported: string = ">=0.0.1";
  /**
   * Regex used to parse the version from the version command (returned from {@link determineVersionCommand})
   */
  protected versionRegex: string = "Version: ([0-9]\.[0-9]\.[0-9]).*?";

  /**
   * Creates an instance of base blockchain client.
   * @param {BaseBlockchainClientOptions} options - used to configure the blockchain client.
   */
  constructor(options: BaseBlockchainClientOptions) {
    this.env = options.env || "development";
    this.isDev = options.isDev || (this.env === "development");

    this.config = options.config as Config;
    this.defaults = options.defaults;
    let defaultWsApi = this.defaults.wsApi;
    if (this.isDev) {
      defaultWsApi = this.defaults.devWsApi;
    }
    if (this.defaults.networkType) {
      this.config.networkType = this.config.networkType || this.defaults.networkType;
    }
    if (this.defaults.networkId) {
      this.config.networkId = this.config.networkId || this.defaults.networkId;
    }
    this.config.rpcApi = this.config.rpcApi || this.defaults.rpcApi;
    this.config.wsApi = this.config.wsApi || defaultWsApi;

    this.name = options.name;
    this.prettyName = options.prettyName;
    this.versSupported = options.versSupported;
    this.versionRegex = options.versionRegex;
  }

  /**
   * Gets the CLI command to execute this blockchain client
   */
  get bin() {
    return this.config.ethereumClientBin || this.defaults.bin;
  }

  //#region Overridable Methods
  /**
   * Determines whether the blockchain client is ready by examining the stdout output of the
   * main command (determined by {@link mainCommand})
   * @param {string} data stdout output of the CLI main command
   */
  public isReady(data: string) {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  /**
   * Check if the client needs some sort of 'keep alive' transactions to avoid freezing by inactivity.
   * If true, allows for txs to be sent at regular intervals via the `devtxs on` console command.
   * @returns {boolean} if keep alive is needed
   */
  public needKeepAlive() {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  /**
   * Gets path to a miner class. If a miner is not needed, override this method and log a warning.
   */
  public getMiner() {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  public getBinaryPath() {
    return this.bin;
  }

  /**
   * Command to execute in the CLI to determine the blockchain client version.
   *
   * @example
   *
   * determineVersionCommand() {
   *   return this.bin + " version";
   * }
   */
  public determineVersionCommand() {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  /**
   * Parses a version from the output of the {@link determineVersionCommand}.
   * @param rawVersionOutput
   * @returns {string} string version of the blockchain client
   */
  public parseVersion(rawVersionOutput: string) {
    let parsed = "0.0.0";
    const match = rawVersionOutput.match(new RegExp(this.versionRegex));
    if (match) {
      parsed = match[1].trim();
    }
    return parsed;
  }

  /**
   * Determines whether the current blockchain client installed on the machine is supported.
   * The supported versions can be specified in the plugin constructor.
   * @param {string} parsedVersion version parsed from the CLI vesrion command output
   * @returns {boolean} true if the current blockchain client version is supported
   */
  public isSupportedVersion(parsedVersion: string) {
    let test;
    try {
      let v = semver(parsedVersion);
      v = `${v.major}.${v.minor}.${v.patch}`;
      test = semver.Range(this.versSupported).test(semver(v));
      if (typeof test !== "boolean") {
        test = undefined;
      }
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      // tslint:disable-next-line: no-unsafe-finally
      return test;
    }
  }

  /**
   * Fired before the main blockchain command is run, the client should use this method to
   * perform any initialization routine that it needs.
   * @param {Callback<null>} callback Callback called after the initChain finishes its routine.
   * @returns {void}
   */
  public initChain(callback: Callback<null>) {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  /**
   * Main command to run in the CLI that starts up the blockchain client process
   * @param {string} address this is not used, and will always be an empty string
   * @param done callback to be called with arguments to run in the CLI.
   * @example
   *
   * mainCommand(_address, done) {
   *  done(this.bin, ["--rpc", "--ws"]);
   * }
   */
  public mainCommand(address: string, done: (bin: string, args: string[]) => void) {
    throw new Error(NOT_IMPLEMENTED_EXCEPTION);
  }

  //#endregion
}
