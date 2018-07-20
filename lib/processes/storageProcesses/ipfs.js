const child_process = require('child_process');
const ProcessWrapper = require('../processWrapper');
const constants = require('../../constants');

let ipfsProcess; // eslint-disable-line no-unused-vars

class IPFSProcess extends ProcessWrapper {
  constructor(options) {
    super();

    this.cors = options.cors;
    this.command = 'ipfs';

    this.checkIPFSVersion();
    this.startIPFSDaemon();
  }

  checkIPFSVersion() {
    child_process.exec(this.command + ' --version', {silent: true}, (err, stdout, _stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      const match = stdout.match(/[0-9]+\.[0-9]+\.[0-9]+/);
      if (match[0]) {
        const versions = match[0].split('.');
        if (versions[0] <= 0 && versions[1] <= 4 && versions[2] <= 14) {
          console.error(`You are using IPFS version ${match[0]} which has an issue with processes.`);
          console.error(`Please update to IPFS version 0.4.15 or more recent: https://github.com/ipfs/ipfs-update`);
        }
      }
    });
  }

  _bindChildEvents(childProcess){
    const self = this;

    childProcess.on('error', (err) => {
      err = err.toString();
      console.error('IPFS error: ', err);
    });

    childProcess.stderr.on('data', (data) => {
      data = data.toString();
      console.log(`IPFS error: ${data}`);
      // `ipfs daemon called`, but `ipfs init` had not been run yet
      if(!self.initCalled && data.indexOf('no IPFS repo found') > -1) { 
        self.initCalled = true;
        let ipfsInitChild = child_process.spawn(this.command, ['init']);
        self._bindChildEvents(ipfsInitChild);
      }
    });

    childProcess.stdout.on('data', (data) => {
      data = data.toString();

      // ipfs init just run, and we have a successful result
      // re-run `ipfs daemon`
      if(self.initCalled && !self.readyCalled && data.indexOf('peer identity:') > -1) { 
        self.startIPFSDaemon();
      }
      else if (!self.readyCalled && data.indexOf('Daemon is ready') > -1) {
        self.readyCalled = true;

        // update IPFS cors before spawning a daemon (muhaha)
        let ipfsCorsCmd = `${self.command} config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\\"${self.cors.join('\\", \\"')}\\"]"`;
        console.trace(`Updating IPFS CORS using command: ${ipfsCorsCmd}`);
        child_process.exec(ipfsCorsCmd, {silent: true}, (err, stdout, _stderr) => {
          if(err){
            err = err.toString();
            console.error('IPFS CORS update error: ', err);
          }
          if(_stderr){
            _stderr = _stderr.toString();
            console.error(`IPFS CORS update error: ${_stderr}`);
          }
          child_process.exec(self.command + ' config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\\"true\\"]"', {silent: true}, (err, stdout, _stderr) => {
            if(err){
              err = err.toString();
              console.error('IPFS CORS update error: ', err);
            }
            if(_stderr){
              _stderr = _stderr.toString();
              console.error(`IPFS CORS update error: ${_stderr}`);
            }
            child_process.exec(self.command + ' config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\\"PUT\\", \\"POST\\", \\"GET\\"]"', {silent: true}, (err, stdout, _stderr) => {
              if(err){
                err = err.toString();
                console.error('IPFS CORS update error: ', err);
              }
              if(_stderr){
                _stderr = _stderr.toString();
                console.error(`IPFS CORS update error: ${_stderr}`);
              }

              self.send({result: constants.storage.initiated});
            });
          });
        });
      }
      console.log('IPFS: ' + data);
    });
    childProcess.on('exit', (code) => {
      if (code) {
        console.error('IPFS exited with error code ' + code);
      }
    });
  }

  startIPFSDaemon() {
    const self = this;
    
    // spawn the daemon (muhaha)
    this.child = child_process.spawn(this.command, ['daemon']);

    self._bindChildEvents(this.child);
  }

  kill() {
    if (this.child) {
      this.child.kill();
    }
  }
}

process.on('message', (msg) => {
  if (msg === 'exit') {
    return ipfsProcess.kill();
  }
  if (msg.action === constants.storage.init) {
    ipfsProcess = new IPFSProcess(msg.options);
  }
});
