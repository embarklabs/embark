const {PerformanceObserver, performance} = require('perf_hooks');
const _ = require('underscore');
require('colors');
const i18n = require('../i18n/i18n.js');
i18n.setOrDetectLocale('en');


class NpmTimer{
  constructor(options){
    this._logger = options.logger;
    this._packageName = options.packageName;
    this._version = options.version;
    this._showSpinner = options.showSpinner || false;
    this._spinnerStyle = options.spinnerStyle || 'dots';
    this._interval = options.interval || 750;
    
    // define mark and measurement names
    this._startMark = 'downloadStart' + this._packageName + this._version;
    this._ongoingMark = 'downloadOngoingMark' + this._packageName + this._version;
    this._downloadOngoing = 'downloadOngoing' + this._packageName + this._version;
    this._endMark = 'downloadEnd' + this._packageName + this._version;
    this._downloadComplete = 'downloadComplete' + this._packageName + this._version;
    
    this.observer.observe({entryTypes: ['measure']});

    
  }

  get observer(){
    if(typeof this._observer == 'undefined'){
      this._observer = new PerformanceObserver((items) => {
        let entry;
        let strDuration;
  
        // find any download ongoing measurements we've made
        entry = _.last(_.where(items.getEntries(), {name: this._downloadOngoing}));
        if(entry){
          // ongoing performance mark 
          strDuration = __('Downloading and installing {{packageName}} {{version}}... ({{duration}}ms elapsed)', {packageName: this._packageName, version: this._version, duration: entry.duration});
          if(this._spinner) this._spinner.text = strDuration;
        }
        else{
          // otherwise, find our download complete measurement
          entry = _.last(_.where(items.getEntries(), {name: this._downloadComplete}));
          
          if(entry){
            strDuration = __('Finished downloading and installing {{packageName}} {{version}} in {{duration}}ms', {packageName: this._packageName, version: this._version, duration: entry.duration});
            performance.clearMarks();
            if(this._spinner) this._spinner.succeed(strDuration);
          }
        }
        
        // log our measurement and make it red if it has taken too long
        if(!this._showSpinner && entry && strDuration){
          if(entry.duration > 4000){
            strDuration = strDuration.red;
          }
          this._log(strDuration);
        }
        
      });
    }
    return this._observer;
  }

  _log(msg){
    if(typeof this._logger.info == 'function'){
      this._logger.info(msg);
    }
    else{ // occurs in subprocess as functions are not serialised/deserialised properly
      console.log(msg.green);
    }
  }
  
  start(){
    let self = this;

    const strDownloadStart = __("Downloading and installing {{packageName}} {{version}}...", {packageName: this._packageName, version: this._version});
    if(this._showSpinner){
      const ora = require('ora');
      this._spinner = ora({
        spinner: this._spinnerStyle,
        text: strDownloadStart
      }).start();
    }else{
      this._log(strDownloadStart);
    }

    // mark our start time
    performance.mark(this._startMark);
    
    // function that continually updates the console to show user that we're downloading a library
    this._intOngoingDownload = setInterval(
      function(){ 
        self._log('npmTimer: hit an interval');
        performance.mark(self._ongoingMark);
        performance.measure(self._downloadOngoing, self._startMark, self._ongoingMark); 
      }, this._interval);
  }

  end(){
    // stop updating console for ongoing download
    clearInterval(this._intOngoingDownload);
    performance.mark(this._endMark);
    performance.measure(this._downloadComplete, this._startMark, this._endMark);
  }
}

module.exports = NpmTimer;
