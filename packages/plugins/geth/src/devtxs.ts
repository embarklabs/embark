import { __ } from 'embark-i18n';
import { Embark, Events, Logger } from "embark";
import Web3 from "web3";
import constants from "embark-core/constants.json";
export default class DevTxs {
  private embark: Embark;
  private events: Events;
  private logger: Logger;
  private web3?: Web3;
  private regularTxsInt?: NodeJS.Timeout;
  constructor(embark: Embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
  }
  public async init() {
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    this.web3 = new Web3(provider);

    const accounts = await this.web3.eth.getAccounts();
    this.web3.eth.defaultAccount = accounts[0];

    this.registerConsoleCommands();
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
        const receipt = await this.sendTx();
        callback(null, __("Transaction sent. Tx hash: ") + `\n${JSON.stringify(receipt && receipt.transactionHash)}`);
      }
    });
  }

  private async sendTx() {
    if (!this.web3) {
      return;
    }
    return this.web3.eth.sendTransaction({ value: "0", to: this.web3.eth.defaultAccount, from: this.web3.eth.defaultAccount });
  }

  public async startRegularTxs() {
    if (this.regularTxsInt) {
      throw new Error("Regular txs already started.");
    }
    if (!this.web3) {
      return;
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
