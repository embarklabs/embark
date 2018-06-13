let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let currentSolcVersion = require('../../../package.json').dependencies.solc;
const ProcessLauncher = require('../../process/processLauncher');
const uuid = require('uuid/v1');

class SolcW {

  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.compilerLoaded = false;
    this.solcProcess = null;
  }

  load_compiler(done) {
    const self = this;
    if (!self.ipc.isClient()) {
      return self.load_compiler_internally(done);
    }

    self.ipc.connect((err) => {
      if (err) {
        return self.load_compiler_internally(done);
      }
      self.compilerLoaded = true;
      done();
    });
  }

  load_compiler_internally(done) {
    const self = this;
    if (this.compilerLoaded) {
      return done();
    }
    this.solcProcess = new ProcessLauncher({
      modulePath: utils.joinPath(__dirname, 'solcP.js'),
      logger: self.logger,
      events: self.events
    });

    this.solcProcess.once("result", "initiated", () => {
      this.events.request("version:get:solc", function(solcVersion) {
        if (solcVersion === currentSolcVersion) {
          self.solcProcess.send({action: 'loadCompiler', requirePath: 'solc'});
        } else {
          self.events.request("version:getPackagePath", "solc", solcVersion, function(err, path) {
            if (err) {
              return done(err);
            }
            let requirePath = fs.dappPath(path);
            self.solcProcess.send({action: 'installAndLoadCompiler', solcVersion: solcVersion, packagePath: requirePath});
          });
        }
      });
    });

    this.solcProcess.once("result", "loadedCompiler", () => {
      self.compilerLoaded = true;
      done();
    });

    this.solcProcess.send({action: "init", options: {}});

    if (this.ipc.isServer()) {
      this.ipc.on('compile', self.compile.bind(this));
    }
  }

  isCompilerLoaded() {
    return (this.compilerLoaded === true);
  }

  compile(jsonObj,  done) {
    const id = uuid();

    if (this.ipc.isClient() && this.ipc.connected) {
      return this.ipc.request('compile', jsonObj, done);
    }

    this.solcProcess.once('result', 'compilation-' + id, (msg) => {
      done(JSON.parse(msg.output));
    });

    this.solcProcess.send({action: 'compile', jsonObj: jsonObj, id});
  }
}

module.exports = SolcW;

