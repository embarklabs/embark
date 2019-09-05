import { ProcessWrapper } from 'embark-core';
const child_process = require('child_process');
const constants = require('embark-core/constants');
const async = require('async');

let ipfsProcess;

const IPFS_DEFAULT_CONFIG_ERROR = ".HTTPHeaders key has no attributes";

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

    childProcess.stdout.on('data', async (data) => {
      data = data.toString();

      // ipfs init just run, and we have a successful result
      // re-run `ipfs daemon`
      if(self.initCalled && !self.readyCalled && data.indexOf('peer identity:') > -1) {
        self.startIPFSDaemon();
      }
      else if (!self.readyCalled && data.indexOf('Daemon is ready') > -1) {
        self.readyCalled = true;

        // check cors config before updating if needed
        async.parallel({
          api: (next) => {
            self.getApiCorsConfig(next);
          },
          gateway: (next) => {
            self.getGatewayCorsConfig(next);
          }
        }, (err, corsConfig) => {
            // results is now equals to: {one: 1, two: 2}
            if(err && err.indexOf(IPFS_DEFAULT_CONFIG_ERROR) === -1){
              return console.error('Error getting IPFS CORS config: ', err);
            }

            if(self.corsConfigNeedsUpdate(corsConfig)){
              // update IPFS cors config
              return self.updateCorsConfig(err => {
                if(err){
                  console.error('IPFS CORS update error: ', err);
                }
                self.send({result: constants.storage.restart}, () => {
                  childProcess.kill();
                });
              });
            }
            self.send({result: constants.storage.initiated});
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

  corsConfigNeedsUpdate(config) {
    let needsUpdate = false;
    try {
      // test to ensure we have all cors needed
      let corsConfig = new Set(JSON.parse(config.api).concat(JSON.parse(config.gateway)));
      needsUpdate = !this.cors.every(address => corsConfig.has(address));
    }
    catch (_e) {
      needsUpdate = true;
    }
    return needsUpdate;
  }

  getApiCorsConfig(cb){
    let ipfsCorsCmd = `${this.command} config API.HTTPHeaders.Access-Control-Allow-Origin`;

    child_process.exec(ipfsCorsCmd, {silent: true}, (err, stdout, stderr) => {
      if(err || stderr){
        err = (err || stderr).toString();
        return cb(err);
      }
      cb(null, stdout);
    });
  }

  getGatewayCorsConfig(cb){
    let ipfsCorsCmd = `${this.command} config Gateway.HTTPHeaders.Access-Control-Allow-Origin`;

    child_process.exec(ipfsCorsCmd, {silent: true}, (err, stdout, stderr) => {
      if(err || stderr){
        err = (err || stderr).toString();
        return cb(err);
      }
      cb(null, stdout);
    });
  }

  updateCorsConfig(cb){
    // update IPFS cors before spawning a daemon (muhaha)
    let ipfsCorsCmd = `${this.command} config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\\"${this.cors.join('\\", \\"')}\\"]"`;
    console.trace(`Updating IPFS CORS using command: ${ipfsCorsCmd}`);
    // update the API CORS
    child_process.exec(ipfsCorsCmd, {silent: true}, (err, _stdout, stderr) => {
      if(err || stderr){
        err = (err || stderr).toString();
        return cb(err);
      }
      // update the Gateway CORS as well
      child_process.exec(ipfsCorsCmd.replace("API", "Gateway"), {silent: true}, (err, _stdout, stderr) => {
        if(err || stderr){
          err = (err || stderr).toString();
          return cb(err);
        }
        child_process.exec(this.command + ' config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\\"true\\"]"', {silent: true}, (err, _stdout, stderr) => {
          if(err || stderr){
            err = (err || stderr).toString();
            return cb(err);
          }
          child_process.exec(this.command + ' config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\\"PUT\\", \\"POST\\", \\"GET\\"]"', {silent: true}, (err, stdout, stderr) => {
            if(err || stderr){
              err = (err || stderr).toString();
              return cb(err);
            }
            cb(null, stdout);
          });
        });
      });
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
      ipfsProcess.send({result: constants.storage.exit});
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
