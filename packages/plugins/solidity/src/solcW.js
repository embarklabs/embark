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
    this.ipcConnected = false;
    this.solcProcess = null;
    this.useDashboard = options.useDashboard;
  }

  load_compiler(done) {
    if (!this.ipc.isClient()) {
      return this.load_compiler_internally(done);
    }

    this.checkIpcConnection((err) => {
      if (err) {
        return this.load_compiler_internally(done);
      }
      this.ipcConnected = true;
      this.compilerLoaded = true;
      done();
    });
  }

  checkIpcConnection(cb) {
    if (this.ipc.connected) {
      this.testIpcConnection(cb);
    }
    this.ipc.connect((err) => {
      if (err) {
        // No IPC. Load internally
        return cb(err);
      }
      this.testIpcConnection(cb);
    });
  }

  testIpcConnection(cb) {
    const connectionTimeout = setTimeout(() => {
      cb('No compiler through IPC connection');
    }, 1000);
    this.ipc.request('testConnection', () => {
      // Connection works, the compiler is available through IPC
      clearTimeout(connectionTimeout);
      cb();
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
      this.ipc.on('testConnection', (cb) => {
        cb(true);
      });
    }
  }

  isCompilerLoaded() {
    return (this.compilerLoaded === true);
  }

  compile(jsonObj,  done) {
    const id = uuid();

    if (this.ipcConnected) {
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
