let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let currentSolcVersion = require('../../../package.json').dependencies.solc;
const ProcessLauncher = require('../../process/processLauncher');
const uuid = require('uuid/v1');
let ipc = require('node-ipc')

class SolcW {

  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.useIpc = options.useIpc;
    this.compilerLoaded = false;
    this.solcProcess = null;
  }

  load_compiler(done) {
    const self = this;
    if (self.useIpc) {
      // try to connect, if it can't then continue
      self.compilerLoaded = true;

      ipc.config.silent = true;

      function connecting(socket) {
        ipc.of['embark'].on('connect',function() {
          done();
        });
      }

      ipc.connectTo('embark', fs.dappPath(".embark/embark.ipc"), connecting);

      return;
    }
    if (this.compilerLoaded) {
      return done();
    }
    this.solcProcess = new ProcessLauncher({
      modulePath: utils.joinPath(__dirname, 'solcP.js'),
      logger: self.logger,
      events: self.events
    });
    this.solcProcess.send({action: "init", options: {}});

    this.solcProcess.once('result', 'loadedCompiler', () => {
      self.compilerLoaded = true;
      done();
    });

    ipc.config.silent = true;

    function _connecting() {
      ipc.server.on(
        'message',
        function(data, socket) {
           self.compile(data.message, (result) => {
             ipc.server.emit(socket, 'message', {action: 'compilation', message: result});
           });
        }
      );
    }

    ipc.serve(fs.dappPath(".embark/embark.ipc"), _connecting)
    ipc.server.start()
    this.logger.info(`pid ${process.pid} listening on ${fs.dappPath(".embark/embark.ipc")}`);

    this.events.request("version:get:solc", function(solcVersion) {
      if (solcVersion === currentSolcVersion) {
        self.solcProcess.send({action: 'loadCompiler', requirePath: 'solc'});
      } else {
        self.events.request("version:getPackageLocation", "solc", solcVersion, function(err, location) {
          if (err) {
            return done(err);
          }
          let requirePath = fs.dappPath(location);
          self.solcProcess.send({action: 'loadCompiler', requirePath: requirePath});
        });
      }
    });
  }

  isCompilerLoaded() {
    return (this.compilerLoaded === true);
  }

  compile(jsonObj,  done) {
    const id = uuid();
    let a = new Date();

    if (this.useIpc) {
      ipc.of['embark'].once('message', function(msg) {
        done(msg.message);
      });

      ipc.of['embark'].emit('message', {action: 'compile', message: jsonObj});
      return;
    }

    this.solcProcess.once('result', 'compilation-' + id, (msg) => {
      done(JSON.parse(msg.output));
    });

    this.solcProcess.send({action: 'compile', jsonObj: jsonObj, id});
  }
}

module.exports = SolcW;

