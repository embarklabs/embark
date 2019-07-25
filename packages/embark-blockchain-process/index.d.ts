import { Environment } from "embark";

declare module "embark-blockchain-process" {

  /**
   * Node account settings in the blockchain config.
   */
  export interface NodeAccountSetting {
    /**
     * Number of node accounts to create if they don't already exist.
     */
    numAccounts: Number;
    /**
     * Password for creating and unlocking node accounts
     */
    password: String;
    /**
     * Balance to send to each of the node accounts (development only)
     */
    balance: String;
  }
  export interface Config {
    silent: boolean;
    client: string;
    ethereumClientBin: string;
    networkType: string;
    networkId: number;
    genesisBlock: string | boolean;
    datadir: string;
    mineWhenNeeded: boolean;
    rpcHost: string;
    rpcPort: number;
    rpcCorsDomain: string;
    rpcApi: Array<String>;
    port: number;
    nodiscover: boolean;
    mine: boolean;
    account: NodeAccountSetting;
    whisper: boolean;
    maxpeers: number;
    bootnodes: string;
    wsRPC: boolean;
    wsHost: string;
    wsPort: number;
    wsOrigins: string | boolean;
    wsApi: Array<string>;
    vmdebug: boolean;
    targetGasLimit: number;
    syncMode: string;
    verbosity: number;
    proxy: boolean;
  }
  /**
   * Options passed in to the blockchain plugin client
   */
  export interface BaseBlockchainClientOptions {
    /**
     * Blockchain client config
     */
    config: Config;
    /**
     * The current runtime environment of Embark, set by running `embark run <environment>`.
     */
    env: Environment;
    /**
     * Determined by whether the current runtime environment is development or not.
     */
    isDev: boolean;
    /**
     * Name of blockchain client - used in the blockchain config "client" property
     */
    name: string;
    /**
     * Pretty name of blockchain client
     */
    prettyName: string;
    /**
     * Default client configuration options
     */
    defaults: BlockchainClientDefaults;
    /**
     * Mimimum client version supported, ie ">=1.3.0"
     */
    versSupported: string;
    /**
     * Regex used to parse the version from the version command (returned from determineVersionCommand())
     */
    versionRegex: string;
    /**
     * Absolute path to the blockchain client class
     * @example
     * require.resolve("./client")
     */
    clientPath: string;
  }

  /**
   * Options to pass to the base class and to the blockchain client.
   */
  export interface BlockchainClientDefaults {
    /**
     * CLI binary to run the blockchain client
     * @example
     * geth
     * @example
     * lightchain
     */
    bin: string;
    /**
     * Network type. This can be used in the blockchain client to run differently for different networks.
     * @example
     * standalone
     * @example
     * sirius
     */
    networkType?: string;
    /**
     * RPC APIs to expose in the blockchain client
     * @example
     * ['eth', 'web3', 'net', 'debug', 'personal']
     */
    rpcApi: Array<string>;
    /**
     * Websockets APIs to expose in the blockchain client
     * @example
     * ['eth', 'web3', 'net', 'debug', 'pubsub', 'personal']
     */
    wsApi: Array<string>;
    /**
     * Websockets APIs to expose in the blockchain client when running in development mode.
     * @example
     * ['eth', 'web3', 'net', 'debug', 'pubsub', 'personal']
     */
    devWsApi: Array<string>;
    /**
     * Network ID of the network connected to by the blockchain client. The network connection
     * can be determined in the blockchain client, based on config settings like networkType and
     * runtime environment.
     */
    networkId?: number;
    /**
     * Target gas limit for the blockchain client.
     */
    targetGasLimit?: number;
  }
}