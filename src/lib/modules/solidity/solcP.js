const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const constants = require('../../constants');
const Utils = require('../../utils/utils');
const ProcessWrapper = require('../../core/processes/processWrapper');
const PluginManager = require('live-plugin-manager-git-fix').PluginManager;
import LongRunningProcessTimer  from '../../utils/longRunningProcessTimer';

class SolcProcess extends ProcessWrapper {

  constructor(options) {
    super({pingParent: false});
    this._logger = options.logger;
    this._showSpinner = options.showSpinner === true;
    this._providerUrl = options.providerUrl;
  }

  findImports(filename) {
    if (filename.startsWith('http') || filename.startsWith('git')) {
      const fileObj = Utils.getExternalContractUrl(filename, this._providerUrl);
      filename = fileObj.filePath;
    }
    if (fs.existsSync(filename)) {
      return {contents: fs.readFileSync(filename).toString()};
    }
    if (fs.existsSync(path.join('./node_modules/', filename))) {
      return {contents: fs.readFileSync(path.join('./node_modules/', filename)).toString()};
    }
    if (fs.existsSync(path.join(constants.httpContractsDirectory, filename))) {
      return {contents: fs.readFileSync(path.join(constants.httpContractsDirectory, filename)).toString()};
    }
    return {error: 'File not found'};
  }

  installAndLoadCompiler(solcVersion, packagePath) {
    let self = this;
    return new Promise((resolve, reject) => {
      let manager = new PluginManager({pluginsPath: packagePath});
      let timer;
      if (!fs.existsSync(packagePath)) {
        timer = new LongRunningProcessTimer(
          self._logger,
          'solc',
          solcVersion,
          'Downloading and installing {{packageName}} {{version}}...',
          'Still downloading and installing {{packageName}} {{version}}... ({{duration}})',
          'Finished downloading and installing {{packageName}} {{version}} in {{duration}}',
          { showSpinner: self._showSpinner }
        );
      }

      if (timer) timer.start();
      manager.install('solc', solcVersion).then(() => {
        self.solc = manager.require('solc');
        if (timer) timer.end();
        resolve();
      }).catch(reject);

    });
  }

  compile(jsonObj, cb) {
    // TODO: only available in 0.4.11; need to make versions warn about this
    try {
      let func = this.solc.compileStandardWrapper;
      if (semver.gte(this.solc.version(), '0.5.0')) {
        func = this.solc.compile;
      }
      let output = func(JSON.stringify(jsonObj), this.findImports);
      cb(null, output);
    } catch (err) {
      cb(err.message);
    }
  }


}

let solcProcess;
process.on('message', (msg) => {
  if (msg.action === "init") {
    solcProcess = new SolcProcess(msg.options);
    return process.send({result: "initiated"});
  }

  else if (msg.action === 'loadCompiler') {
    solcProcess.solc = require('solc');
    return process.send({result: "loadedCompiler"});
  }

  else if (msg.action === 'installAndLoadCompiler') {
    solcProcess.installAndLoadCompiler(msg.solcVersion, msg.packagePath).then(() => {
      return process.send({result: "loadedCompiler"});
    });
  }

  else if (msg.action === 'compile') {
    solcProcess.compile(msg.jsonObj, (err, output) => {
      process.send({result: "compilation-" + msg.id, err: err, output: output});
    });
  }
});
