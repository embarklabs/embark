import { Embark, Events } from "embark";
import Web3 from "web3";
import { BaseBlockchainClientOptions } from "../index";

const NOT_IMPLEMENTED_EXCEPTION = "This method has not been implemented";

/**
 * Base blockchain plugin. Extend this class in your custom blockchain client plugin.
 */
export class BaseBlockchainPlugin {
  protected embark: Embark;
  protected events: Events;
  protected web3?: Web3;
  protected blockchainClientOptions: BaseBlockchainClientOptions;
  protected blockchainConfig: any;
  /**
   * Creates an instance of base blockchain plugin.
   * @param {Embark} embark - Embark object, used to get the Events object.
   * @param {BaseBlockchainClientOptions} blockchainClientOptions - options for the plugin name
   * and version, and options that will be passed to the blockchain client.
   */
  constructor(embark: Embark, blockchainClientOptions: BaseBlockchainClientOptions) {
    this.embark = embark;
    this.events = embark.events;
    this.blockchainClientOptions = blockchainClientOptions;

    // gets hydrated blockchain config from embark, use it to init
    this.events.once("config:load:blockchain", (blockchainConfig: any) => {
      this.blockchainConfig = blockchainConfig;
      // Only register the blockchain plugin and event actions if the current
      // run time environment is using this blockchain plugin.
      // Without this, registered and unfired event actions would cause the
      // blockchain process to hang.
      if (this.shouldInit(blockchainConfig)) {
        this.registerBlockchain();
        this.registerProviderReadyAction();
      }
    });
  }

  /**
   * Registers provider ready action. This will be triggered by the blockchain connector
   * and once registered, the blockchain connector will wait for these actions to
   * complete before continuing.
   *
   * These actions occur prior to the "blockchain:ready" event and provide the perfect
   * time to create and unlock accounts.
   */
  private registerProviderReadyAction() {
    this.embark.registerActionForEvent("blockchain:provider:ready", async (cb) => {
      if (!this.createAndUnlockAccounts) {
        return cb();
      }
      this.events.request("blockchain:get", async (web3: Web3) => {
        this.web3 = web3;
        await this.createAndUnlockAccounts();
        cb();
      });
    });
  }

  //#region Overridable Methods

  /**
   * Creates and unlocks accounts according to the blockchain configuration.
   *
   * Override this method to create a custom account management implementation.
   *
   * If you do not need to create and unlock accounts, override this method in
   * your plugin class, and return immediately. Otherwise, an error will be thrown.
   */
  protected async createAndUnlockAccounts() {
    throw new Error(`[BaseBlockchainPlugin.onProviderReady]: ${NOT_IMPLEMENTED_EXCEPTION}`);
  }

  /**
   * Should init - prevents or enables Embark to consider this plugin as a valid plugin
   * at run time. This can be overridden by your custom plugin if additional conditions
   * are needed.
   * @param {any} blockchainConfig Blockchain configuration object
   * @returns {boolean} true if the run time client name (based on the "client"
   * property in the current run time blockchain config) is set to the name of
   * this blockchain client plugin.
   */
  protected shouldInit(blockchainConfig: any) {
    return blockchainConfig.client === this.blockchainClientOptions.name;
  }

  /**
   * Registers the blockchain client as a plugin in Embark.
   */
  protected registerBlockchain() {
    this.embark.registerBlockchain(
      this.blockchainClientOptions.name,
      this.blockchainClientOptions.clientPath,
      this.blockchainClientOptions,
      this.shouldInit.bind(this));
  }
  //#endregion
}
