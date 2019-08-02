import { ContractConfig, Logger } from "embark";
const { sha3 } = require("embark-utils");
import { ABIDefinition } from "web3/eth/abi";

export default class Contract {
  private logger: Logger;
  public abiDefinition?: ABIDefinition[];
  public deployedAddress?: string;
  public className: string = "";
  public address?: string;
  public args?: any[] = [];
  public instanceOf?: string;
  public gas?: number;
  public gasPrice?: number;
  public silent?: boolean = false;
  public track?: boolean = true;
  public deploy?: boolean = true;
  public realRuntimeBytecode: string = "";
  public realArgs: any[] = [];
  constructor(logger: Logger, contractConfig: ContractConfig) {
    this.logger = logger;
    this.address = contractConfig.address;
    this.args = contractConfig.args;
    this.instanceOf = contractConfig.instanceOf;
    this.gas = contractConfig.gas;
    this.gasPrice = contractConfig.gasPrice;
    this.silent = contractConfig.silent;
    this.track = contractConfig.track;
    this.deploy = contractConfig.deploy;
  }

  /**
   * Calculates a hash from runtime bytecode, classname, and deploy arguments.
   * Used for uniquely identifying a contract, ie in chains.json.
   */
  get hash() {
    return sha3(this.realRuntimeBytecode + this.className + (this.realArgs || this.args).join(","));
  }

  /**
   * Logs a message to the console. Logs with loglevel trace if contract has it's silent
   * property set (in the config or internally, ie ENS contracts). Otherwise, logs with
   * info log level.
   * @param {string} message message to log to the console
   */
  public log(message: string) {
    this.silent ? this.logger.trace(message) : this.logger.info(message);
  }
}
