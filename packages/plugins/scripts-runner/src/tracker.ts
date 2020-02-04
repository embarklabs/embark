import { Embark } from 'embark-core';
import * as fs from 'fs-extra';
import { dappPath } from 'embark-utils';
import { BlockTransactionObject } from 'web3-eth';
import Web3 from "web3";

export interface TrackingData {
  [key: string]: {
    migrations: string[];
  };
}

export interface TrackConfig {
  scriptName: string;
  scriptDirectory: string;
  forceTracking: boolean;
  migrationsDir?: string;
}

export interface ScriptsTracker {
  ensureTrackingFile(): Promise<void>;
  track(trackConfig: TrackConfig): Promise<void>;
  isTracked(scriptName: string): Promise<boolean>;
}

const DEFAULT_TRACKING_FILE_PATH = '.embark/chains.json';

export class FileSystemTracker implements ScriptsTracker {

  private _block: BlockTransactionObject | null = null;

  private _web3: Web3 | null = null;

  private migrationsDirectory: string;

  private trackingFilePath: string;

  constructor(private embark: Embark) {
    this.trackingFilePath = dappPath(embark.config.contractsConfig?.tracking || DEFAULT_TRACKING_FILE_PATH);
    this.migrationsDirectory = embark.config.embarkConfig.migrations;
  }

  private get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.embark.events.request2('blockchain:client:provider', 'ethereum');
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  get block() {
    return (async () => {
      if (this._block) {
        return this._block;
      }
      const web3 = await this.web3;
      try {
        this._block = await web3.eth.getBlock(0, true);
      } catch (err) {
        // Retry with block 1 (Block 0 fails with Ganache-cli using the --fork option)
        this._block = await web3.eth.getBlock(1, true);
      }
      return this._block;
    })();
  }

  async ensureTrackingFile() {
    const fstat = await fs.stat(this.trackingFilePath);
    if (!fstat.isFile()) {
      const block = await this.block;
      if (block) {
        await fs.outputJSON(this.trackingFilePath, {
          [block.hash]: {
            name: this.embark.env,
            migrations: []
          }
        });
      }
    }
  }

  async track(trackConfig: TrackConfig) {
    const {
      scriptName,
      scriptDirectory,
      forceTracking,
    } = trackConfig;

    if (forceTracking || scriptDirectory === this.migrationsDirectory) {
      const block = await this.block;

      if (block) {
        const trackingData = await fs.readJSON(this.trackingFilePath) as TrackingData;

        if (!trackingData[block.hash].migrations) {
          trackingData[block.hash].migrations = [];
        }

        if (!trackingData[block.hash].migrations.includes(scriptName)) {
          trackingData[block.hash].migrations.push(scriptName);
          await fs.writeJSON(this.trackingFilePath, trackingData, { spaces: 2 });
        }
      }
    }
  }

  async isTracked(scriptName: string) {
    const block = await this.block;
    const trackingData = await fs.readJSON(this.trackingFilePath) as TrackingData;
    return (block &&
      trackingData &&
      trackingData[block.hash]?.migrations &&
      trackingData[block.hash]?.migrations.includes(scriptName)) ?? false;
  }

}
