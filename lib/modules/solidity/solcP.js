const fs = require('fs-extra');
const path = require('path');
const constants = require('../../constants');
const Utils = require('../../utils/utils');
const ProcessWrapper = require('../../process/processWrapper');
const PluginManager = require('live-plugin-manager').PluginManager;

class SolcProcess extends ProcessWrapper {

  findImports(filename) {
    if (filename.startsWith('http') || filename.startsWith('git')) {
      const fileObj = Utils.getExternalContractUrl(filename);
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

  installAndLoadCompiler(solcVersion, packagePath){
    let self = this;
    return new Promise((resolve) => {      
      let manager = new PluginManager({pluginsPath: packagePath});
      manager.install('solc', solcVersion).then(() => {
        self.solc = manager.require('solc');
        resolve();
      });
    });
  }

  compile(jsonObj, cb) {
    // TODO: only available in 0.4.11; need to make versions warn about this
    let output = this.solc.compileStandardWrapper(JSON.stringify(jsonObj), this.findImports);
    cb(output);
  }


}

let solcProcess;

process.on('message', function (msg) {
  if (msg.action === "init") {
    solcProcess = new SolcProcess(msg.options);
    return this.send({result: "initiated"});
  }

  else if (msg.action === 'loadCompiler') {
    require('solc');
    return this.send({result: "loadedCompiler"});
  }

  else if (msg.action == 'installAndLoadCompiler') {
    solcProcess.installAndLoadCompiler(msg.solcVersion, msg.packagePath).then(() => {
      return this.send({result: "loadedCompiler"});
    });
  }

  else if (msg.action === 'compile') {
    solcProcess.compile(msg.jsonObj, (output) => {
      this.send({result: "compilation-" + msg.id, output: output});
    });
  }
});

