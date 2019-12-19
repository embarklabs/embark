import { __ } from 'embark-i18n';
import { Embark, EmbarkEvents, Configuration } from "embark-core";
import { Logger } from "embark-logger";
import Web3 from "web3";
import { TransactionReceipt } from "web3-eth";
import constants from "embark-core/constants.json";
export default class DevTxs {
  private embark: Embark;
  private blockchainConfig: Configuration["blockchainConfig"];
  private events: EmbarkEvents;
  private logger: Logger;
  private web3?: Web3;
  private regularTxsInt?: NodeJS.Timeout;
  constructor(embark: Embark) {
    this.embark = embark;
    this.blockchainConfig = this.embark.config.blockchainConfig;
    this.logger = embark.logger;
    this.events = embark.events;
  }

  public async init() {
    if (!this.shouldStartDevTxs()) {
      return;
    }
    const provider = await this.events.request2("blockchain:node:provider", "ethereum");
    this.web3 = new Web3(provider);

    const accounts = await this.web3.eth.getAccounts();
    this.web3.eth.defaultAccount = accounts[0];

    this.registerConsoleCommands();
  }

  private shouldStartDevTxs() {
    return (this.blockchainConfig.enabled && this.blockchainConfig.clientConfig && this.blockchainConfig.clientConfig.miningMode === 'dev');
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: __("Toggles regular transactions used to prevent transactions from getting stuck when using Geth and Metamask"),
      matches: ["devtxs on", "devtxs off", "regularTxs on", "regularTxs off"],
      usage: "devtxs on/off",
      process: async (cmd, callback) => {
        const enable = cmd.trim().endsWith('on');
        this.logger.info(`${enable ? "Enabling" : "Disabling"} regular transactions...`);
        if (enable) {
          try {
            await this.startRegularTxs();
          } catch (err) {
            return callback(err);
          }
          callback(null, __("Regular transactions have been enabled"));
          return;
        }
        try {
          this.stopRegularTxs();
        } catch (err) {
          return callback(err);
        }
        callback(null, __("Regular transactions have been disabled"));
      }
    });

    this.embark.registerConsoleCommand({
      description: __("Sends a transaction from default --dev account (generally used if txs are getting stuck in geth in development)"),
      matches: ["senddevtx"],
      process: async (_cmd, callback) => {
        this.logger.info(__("Sending a tx from the dev account..."));
        const receipt = (await this.sendTx()) as TransactionReceipt;
        callback(null, __("Transaction sent. Tx hash: ") + `\n${JSON.stringify(receipt && receipt.transactionHash)}`);
      }
    });
  }

  private async sendTx() {
    if (!this.web3) {
      return;
    }
    const to = this.web3.eth.defaultAccount || undefined;
    const from = this.web3.eth.defaultAccount || undefined;
    return this.web3.eth.sendTransaction({ value: "0", to, from });
  }

  public async startRegularTxs() {
    if (!this.shouldStartDevTxs()) {
      return;
    }
    if (!this.web3) {
      return;
    }
    if (this.regularTxsInt) {
      throw new Error("Regular txs already started.");
    }

    const networkId = await this.web3.eth.net.getId();
    if (networkId !== constants.blockchain.networkIds.development) {
      return;
    }
    this.regularTxsInt = setInterval(async () => { await this.sendTx(); }, 1000 * 10);
  }

  private stopRegularTxs() {
    if (!this.regularTxsInt) {
      throw new Error("Regular txs not started.");
    }
    clearInterval(this.regularTxsInt);
    this.regularTxsInt = undefined;
  }
}
