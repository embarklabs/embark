import * as path from 'path';
import Hasher from "node-object-hash";
import { CircuitConfig } from "embarkjs-snark";

export default class SetupTracker {
  private _lastRun: any = null;
  private lastRunPath: string;
  private hasher: any;
  constructor(private fs: any, private trackerPath: string) {
    this.fs.ensureDirSync(this.trackerPath);
    this.lastRunPath = path.join(this.trackerPath, "setupTracker.json");
    this.hasher = Hasher({ coerce: false });
  }

  get lastRun(): any {
    return (async () => {
      if (!this._lastRun) {
        let lastRun;
        try {
          lastRun = await this.fs.readJson(this.lastRunPath);
        } catch (_err) {
          lastRun = {};
          this.lastRun = lastRun;
        }
        this._lastRun = lastRun;
      }
      return this._lastRun;
    })();
  }

  // There is no way to avoid this being a fire and forget.
  // IOW, calling functions *cannot* know when this function has completed.
  // In general, we shouldn't worry as the in-memory copy is updated synchronously
  // and the persisted data in the file is not required until the next run.
  set lastRun(lastRun: any) {
    this._lastRun = lastRun;
    this.fs.writeJson(this.lastRunPath, lastRun);
  }

  hash(config: CircuitConfig, compiledCircuit: any) {
    return this.hasher.hash(JSON.stringify(config) + JSON.stringify(compiledCircuit));
  }

  async hasChanged(circuitName: string, config: CircuitConfig, compiledCircuit: any) {
    const lastRun = await this.lastRun;
    return lastRun[circuitName.toLowerCase()] !== this.hash(config, compiledCircuit);
  }

  async update(circuitName, config: CircuitConfig, compiledCircuit: any) {
    const lastRun = await this.lastRun;
    lastRun[circuitName] = this.hash(config, compiledCircuit);
    this.lastRun = lastRun;
  }
}
