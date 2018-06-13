const fs = require('../core/fs.js');
const {PerformanceObserver, performance} = require('perf_hooks');
const PluginManager = require('live-plugin-manager-git-fix').PluginManager;
require('colors');
const _ = require('underscore');

class Npm {

  constructor(options) {
    this.logger = options.logger;
  }

  getPackageVersion(packageName, version, callback) {
    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';

    let manager = new PluginManager({pluginsPath: packageDirectory});

    if (fs.existsSync(packageDirectory + packageName)) {
      return callback(null, packageDirectory + packageName);
    }

    this.logger.info(__("Downloading {{packageName}} {{version}}...", {packageName: packageName, version: version}));

    const obsMeasure = new PerformanceObserver((items) => {
      let entry;
      let strDuration;

      // find any download ongoing measurements we've made
      entry = _.last(_.where(items.getEntries(), {name: downloadOngoing}));
      if(entry){
        // ongoing performance mark 
        strDuration = __('Still downloading {{packageName}} {{version}}... ({{duration}}ms elapsed)', {packageName: packageName, version: version, duration: entry.duration});
      }
      else{
        // otherwise, find our download complete measurement
        entry = _.last(_.where(items.getEntries(), {name: downloadComplete}));
        
        if(entry){
          strDuration = __('Finished downloading {{packageName}} {{version}} in {{duration}}ms', {packageName: packageName, version: version, duration: entry.duration});
          performance.clearMarks();
        }
      }
      
      // log our measurement and make it red if it has taken too long
      if(entry && strDuration){
        if(entry.duration > 4000){
          strDuration = strDuration.red;
        }
        this.logger.info(strDuration);
      }
      
    });
    obsMeasure.observe({entryTypes: ['measure']});

    // define mark and measurement names
    let startMark = 'downloadStart' + packageName + version;
    let ongoingMark = 'downloadOngoingMark' + packageName + version;
    let downloadOngoing = 'downloadOngoing' + packageName + version;
    let endMark = 'downloadEnd' + packageName + version;
    let downloadComplete = 'downloadComplete' + packageName + version;

    // mark our start time
    performance.mark(startMark);
    
    // function that continually updates the console to show user that we're downloading a library
    let intOngoingDownload = setInterval(
      function(){ 
        performance.mark(ongoingMark);
        performance.measure(downloadOngoing, startMark, ongoingMark); 
      }, 750);

    // do the package download/install
    manager.install(packageName, version).then((result) => {
      // stop updating console for ongoing download
      clearInterval(intOngoingDownload);
      performance.mark(endMark);
      performance.measure(downloadComplete, startMark, endMark);
      callback(null , result.location);
    }).catch(callback);
  }
}

module.exports = Npm;
