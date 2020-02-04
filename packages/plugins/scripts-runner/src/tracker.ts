import * as fs from 'fs-extra';
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
  ensureTrackingFile(hash: string): Promise<void>;
  track(trackConfig: TrackConfig): Promise<void>;
  isTracked(scriptName: string): Promise<boolean>;
  setWeb3(web3: Web3);
}

export class FileSystemTracker implements ScriptsTracker {

  private _block: BlockTransactionObject | null = null;

  private web3: Web3 | null = null;

  constructor(private trackingFilePath: string, private migrationsDirectory: string) {}

  get block() {
    return (async () => {
      if (this._block) {
        return this._block;
      }
      try {
        this._block = await this.web3?.eth.getBlock(0, true) || null;
      } catch (err) {
        // Retry with block 1 (Block 0 fails with Ganache-cli using the --fork option)
        this._block = await this.web3?.eth.getBlock(1, true) || null;
      }
      return this._block;
    })();
  }

  setWeb3(web3: Web3) {
    this.web3 = web3;
  }

  async ensureTrackingFile(env: string) {
    const fstat = await fs.stat(this.trackingFilePath);
    if (!fstat.isFile()) {
      const block = await this.block;
      if (block) {
        await fs.outputJSON(this.trackingFilePath, {
          [block.hash]: {
            name: env,
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
