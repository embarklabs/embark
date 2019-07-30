import { __ } from 'embark-i18n';
import * as async from 'async';

class Storage {
  constructor(embark, options){
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.events = this.embark.events;
    this.storageConfig = embark.config.storageConfig;
    this.plugins = options.plugins;

    let plugin = this.plugins.createPlugin('storageplugin', {});
    plugin.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.storageNodes = {};
    this.events.setCommandHandler("storage:node:register", (clientName, startCb) => {
      console.dir("---- registering " + clientName)
      this.storageNodes[clientName] = startCb
    });

    this.events.setCommandHandler("storage:node:start", (storageConfig, cb) => {
      console.dir("--------------------------");
      console.dir("--------------------------");
      console.dir("--------------------------");
      console.dir("--------------------------");
      console.dir("--------------------------");
      console.dir("--------------------------");
      console.dir("--- storage:node:start");
      const clientName = storageConfig.upload.provider;
      console.dir("---- starting...." + clientName);
      const client = this.storageNodes[clientName];
      if (!client) return cb("storage " + clientName + " not found");

      let onStart = () => {
        console.dir("--- storage started")
        this.events.emit("storage:started", clientName);
        cb();
      }

      client.apply(client, [onStart]);
    });

    this.uploadNodes = {};
    this.events.setCommandHandler("storage:upload:register", (clientName, uploadCb) => {
      this.uploadNodes[clientName] = uploadCb;
    });

    this.events.setCommandHandler("storage:upload", (clientName, cb) => {
      const client = this.uploadNodes[clientName];
      if (!client) return cb("upload client for  " + clientName + " not found");
      client.apply(client, [cb]);
    });
  }

  addArtifactFile(_params, cb) {
    let config = {
      dappConnection: this.storageConfig.dappConnection
    };

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'config'],
      file: 'communication.json',
      format: 'json',
      content: config
    }, cb);
  }

  // handleUploadCommand() {
  //   const self = this;
  //   this.embark.events.setCommandHandler('storage:upload', (cb) => {
  //     let platform = this.embark.config.storageConfig.upload.provider;

  //     let uploadCmds = self.plugins.getPluginsProperty('uploadCmds', 'uploadCmds');
  //     for (let uploadCmd of uploadCmds) {
  //       if (uploadCmd.cmd === platform) {
  //         return uploadCmd.cb.call(uploadCmd.cb, cb);
  //       }
  //     }

  //     cb({message: __('platform "{{platform}}" is specified as the upload provider, however no plugins have registered an upload command for "{{platform}}".', {platform: platform})});
  //   });
  // }

  // addSetProviders(cb) {
  //   let code = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.embark.config.storageConfig.dappConnection || [])}, {web3});`;

  //   let shouldInit = (storageConfig) => {
  //     return storageConfig.enabled;
  //   };

  //   this.embark.addProviderInit('storage', code, shouldInit);

  //   async.parallel([
  //     (next) => {
  //       if (!this.storageConfig.available_providers.includes('ipfs')) {
  //         return next();
  //       }
  //       this.embark.events.once('ipfs:process:started', next);
  //     },
  //     (next) => {
  //       if (!this.storageConfig.available_providers.includes('swarm')) {
  //         return next();
  //       }
  //       this.embark.events.once('swarm:process:started', next);
  //     }
  //   ], (err) => {
  //     if (err) {
  //       console.error(__('Error starting storage process(es): %s', err));
  //     }

  //     this.embark.addConsoleProviderInit('storage', code, shouldInit);
  //     // TODO: fix me, this is an ugly workaround for race conditions
  //     // in the case where the storage process is too slow when starting up we
  //     // execute ourselves the setProviders because the console provider init
  //     // was already executed
  //     this.embark.events.request('runcode:eval', `if (Object.keys(EmbarkJS.Storage.Providers).length) { ${code} }`, () => {
  //       this.ready = true;
  //       this.embark.events.emit("module:storage:ready");
  //     }, true);
  //   });
  // }

}

module.exports = Storage;
