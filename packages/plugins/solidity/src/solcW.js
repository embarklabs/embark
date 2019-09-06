import { __ } from 'embark-i18n';
import { ProcessLauncher } from 'embark-core';
import { dappPath, joinPath, toForwardSlashes } from 'embark-utils';
const uuid = require('uuid/v1');

class SolcW {

  constructor(embark, options) {
    this.embark = embark;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.compilerLoaded = false;
    this.solcProcess = null;
    this.useDashboard = options.useDashboard;
    this.providerUrl = options.providerUrl;
  }

  load_compiler(done) {
    const self = this;
    if (!self.ipc.isClient()) {
      return self.load_compiler_internally(done);
    }

    if (self.ipc.connected) {
      self.compilerLoaded = true;
      return done();
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
    if (this.compilerLoaded) {
      return done();
    }
    this.solcProcess = new ProcessLauncher({
      embark: this.embark,
      modulePath: joinPath(__dirname, 'solcP.js'),
      logger: this.logger,
      events: this.events,
      providerUrl: this.providerUrl,
      silent: false
    });

    this.solcProcess.once("result", "initiated", () => {
      this.events.request("version:get:solc", (solcVersion)  => {
        if (solcVersion === this.embark.config.package.dependencies.solc) {
          return this.solcProcess.send({action: 'loadCompiler', requirePath: 'solc'});
        }
        this.events.request("version:getPackageLocation", "solc", solcVersion, (err, location) => {
          if (err) {
            return done(err);
          }
          this.solcProcess.send({
            action: 'loadCompiler',
            requirePath: toForwardSlashes(dappPath(location))
          });
        });
      });
    });

    this.solcProcess.once("result", "loadedCompiler", () => {
      this.compilerLoaded = true;
      done();
    });

    this.solcProcess.send({action: "init", options: {showSpinner: !this.useDashboard}});

    if (this.ipc.isServer()) {
      this.ipc.on('compile', this.compile.bind(this));
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
      if(msg.err) {
        return done(msg.err);
      }
      done(null, JSON.parse(msg.output));
    });

    this.solcProcess.send({action: 'compile', jsonObj: jsonObj, id});
  }
}

module.exports = SolcW;
