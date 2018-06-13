const fs = require('../core/fs.js');
const {PerformanceObserver, performance} = require('perf_hooks');
const PluginManager = require('live-plugin-manager-git-fix').PluginManager;
require('colors');
const _ = require('underscore');

class Npm {

  constructor(options) {
    this.logger = options.logger;
    this.packageName = options.packageName;
    this.version = options.version;
  }

  get packagePath(){
    if(typeof this._packagePath == 'undefined'){
      this._packagePath = './.embark/versions/' + this.packageName + '/' + this.version + '/';
    }
    return this._packagePath;
  }

  get pluginManager(){
    if(typeof this._pluginManager == 'undefined'){
      this._pluginManager = new PluginManager({pluginsPath: this.packagePath});
    }
    return this._pluginManager;
  }

  getPackageVersion(packageName, version, callback) {

    if (fs.existsSync(this.packagePath + packageName)) {
      return callback(null, this.packagePath + packageName);
    }

    this.logger.info(__("Downloading and installing {{packageName}} {{version}}...", {packageName: packageName, version: version}));

    const obsMeasure = new PerformanceObserver((items) => {
      let entry;
      let strDuration;

      // find any download ongoing measurements we've made
      entry = _.last(_.where(items.getEntries(), {name: downloadOngoing}));
      if(entry){
        // ongoing performance mark 
        strDuration = __('Downloading and installing {{packageName}} {{version}}... ({{duration}}ms elapsed)', {packageName: packageName, version: version, duration: entry.duration});
      }
      else{
        // otherwise, find our download complete measurement
        entry = _.last(_.where(items.getEntries(), {name: downloadComplete}));
        
        if(entry){
          strDuration = __('Finished downloading and installing {{packageName}} {{version}} in {{duration}}ms', {packageName: packageName, version: version, duration: entry.duration});
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
    this.pluginManager.install(packageName, version).then((result) => {

      // if(packageName === 'solc'){

      //   async.each(Object.keys(result.dependencies), function(dependency, cb){
          
      //     console.log('getting dependency: ' + dependency + ' ' + result.dependencies[dependency]);
          
      //     self.pluginManager.install(dependency, result.dependencies[dependency]).then(() => {
      //       console.log('installed ' + dependency + ' ' + result.dependencies[dependency]);
      //       cb();
      //     })
      //     .catch(cb);

      //   }, function(err){

      //     // stop updating console for ongoing download
      //     clearInterval(intOngoingDownload);
      //     performance.mark(endMark);
      //     performance.measure(downloadComplete, startMark, endMark);

      //     if(err){
      //       self.logger.error(err);
      //       return callback(err);
      //     }else{
      //       return callback(null, result.location, self.pluginManager);
      //     }
      //   });
      // }
      // else{

        // stop updating console for ongoing download
        clearInterval(intOngoingDownload);
        performance.mark(endMark);
        performance.measure(downloadComplete, startMark, endMark);

        callback(null, result.location);
        
      //}      
    }).catch(callback);
  }
}

module.exports = Npm;
