import { red } from "colors";
import { Logger } from 'embark-logger';
import { performance, PerformanceObserver } from "perf_hooks";
import prettyMs from "pretty-ms";
import { last, recursiveMerge } from "./collections";

const ora = require("ora");

export interface LongRunningProcessTimerOptions {
  showSpinner?: boolean;
  spinnerStyle?: string;
  interval?: number;
  longRunningThreshold?: number;
}

export default class LongRunningProcessTimer {
  private startMark: string;
  private ongoingMark: string;
  private downloadOngoing: string;
  private endMark: string;
  private downloadComplete: string;
  private spinner!: any;
  private intOngoingDownload!: NodeJS.Timeout;

  // backing variables
  private _observer!: PerformanceObserver;

  // default options
  private static readonly DEFAULT_OPTIONS: LongRunningProcessTimerOptions = {
    interval: 750,
    longRunningThreshold: 4000,
    showSpinner: false,
    spinnerStyle: "dots",
  };
  constructor(
    private logger: Logger,
    private packageName: string,
    private version: string,
    private processStartingMsg: string,
    private processOngoingMsg: string,
    private processFinishedMsg: string,
    private options: LongRunningProcessTimerOptions = LongRunningProcessTimer.DEFAULT_OPTIONS,

  ) {
    this.options = recursiveMerge(LongRunningProcessTimer.DEFAULT_OPTIONS, this.options);

    // define mark and measurement names
    this.startMark = "downloadStart" + this.packageName + this.version;
    this.ongoingMark = "downloadOngoingMark" + this.packageName + this.version;
    this.downloadOngoing = "downloadOngoing" + this.packageName + this.version;
    this.endMark = "downloadEnd" + this.packageName + this.version;
    this.downloadComplete = "downloadComplete" + this.packageName + this.version;

    this.observer.observe({ entryTypes: ["measure"] });
  }

  get observer() {
    if (typeof this._observer === "undefined") {
      this._observer = new PerformanceObserver((items) => {
        let entry;
        let strDuration;

        // find any download ongoing measurements we"ve made
        entry = last(items.getEntries().filter((thisEntry: any) => thisEntry.name === this.downloadOngoing));
        if (entry) {
          // ongoing performance mark
          // TODO: add i18n
          strDuration = this.processOngoingMsg.replace("{{packageName}}", this.packageName).replace("{{version}}", this.version).replace("{{duration}}", prettyMs(entry.duration));
          if (this.spinner) {
            this.spinner.text = strDuration;
          }
        } else {
          // otherwise, find our download complete measurement
          entry = last(items.getEntries().filter((thisEntry: any) => thisEntry.name === this.downloadComplete));
          if (entry) {
            // TODO: add i18n
            strDuration = this.processFinishedMsg.replace("{{packageName}}", this.packageName).replace("{{version}}", this.version).replace("{{duration}}", prettyMs(entry.duration));
            performance.clearMarks();
            if (this.spinner) {
              this.spinner.succeed(strDuration);
            }
          }
        }

        // log our measurement and make it red if it has taken too long
        if (!this.options.showSpinner && entry && strDuration !== undefined && this.options && this.options.longRunningThreshold) {
          if (entry.duration > this.options.longRunningThreshold) {
            strDuration = strDuration.red;
          }
          this.logger.info(strDuration);
        }

      });
    }
    return this._observer;
  }

  public start() {
    // TODO: add i18n
    const strDownloadStart = this.processStartingMsg.replace("{{packageName}}", this.packageName).replace("{{version}}", this.version);
    if (this.options.showSpinner) {
      this.spinner = ora({
        spinner: this.options.spinnerStyle,
        text: strDownloadStart,
      }).start();
    } else {
      this.logger.info(strDownloadStart);
    }

    // mark our start time
    performance.mark(this.startMark);

    // function that continually updates the console to show user that we"re downloading a library
    this.intOngoingDownload = setInterval(
      () => {
        performance.mark(this.ongoingMark);
        performance.measure(this.downloadOngoing, this.startMark, this.ongoingMark);
      }, this.options.interval || 0);
  }

  public end() {
    // stop updating console upon success
    clearInterval(this.intOngoingDownload);
    performance.mark(this.endMark);
    performance.measure(this.downloadComplete, this.startMark, this.endMark);
  }

  public abort() {
    if (this.spinner) {
      this.spinner.fail(`Failed to download and install ${this.packageName} ${this.version}\n`);
    }
    // stop updating console upon failure
    clearInterval(this.intOngoingDownload);
  }
}

module.exports = LongRunningProcessTimer;
