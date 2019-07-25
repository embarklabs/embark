import { __ } from 'embark-i18n';
import * as async from 'async';

class Storage {
  constructor(embark, options){
    this.embark = embark;
    this.plugins = options.plugins;
    this.ready = false;

    this.embark.events.setCommandHandler("module:storage:onReady", (cb) => {
      if (this.ready) {
        return cb();
      }
      this.embark.events.once("module:storage:ready", cb);
    });

    this.embark.events.setCommandHandler("module:storageJS:reset", (cb) => {
      if (!this.isEnabled()) {
        return cb();
      }
      this.ready = false;
      this.addSetProviders(cb);
    });

    if (!this.isEnabled()) {
      this.ready = true;
      return;
    }

    this.handleUploadCommand();
    this.addSetProviders(() => {});
  }

  isEnabled() {
    return !!this.embark.config.storageConfig.enabled;
  }

  handleUploadCommand() {
    const self = this;
    this.embark.events.setCommandHandler('storage:upload', (cb) => {
      let platform = this.embark.config.storageConfig.upload.provider;

      let uploadCmds = self.plugins.getPluginsProperty('uploadCmds', 'uploadCmds');
      for (let uploadCmd of uploadCmds) {
        if (uploadCmd.cmd === platform) {
          return uploadCmd.cb.call(uploadCmd.cb, cb);
        }
      }

      cb({message: __('platform "{{platform}}" is specified as the upload provider, however no plugins have registered an upload command for "{{platform}}".', {platform: platform})});
    });
  }

  addSetProviders(cb) {
    let code = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.embark.config.storageConfig.dappConnection || [])}, {web3});`;

    let shouldInit = (storageConfig) => {
      return storageConfig.enabled;
    };

    this.embark.addProviderInit('storage', code, shouldInit);

    async.parallel([
      (next) => {
        if (!this.embark.config.storageConfig.available_providers.includes('ipfs')) {
          return next();
        }
        this.embark.events.once('ipfs:process:started', next);
      },
      (next) => {
        if (!this.embark.config.storageConfig.available_providers.includes('swarm')) {
          return next();
        }
        this.embark.events.once('swarm:process:started', next);
      }
    ], (err) => {
      if (err) {
        console.error(__('Error starting storage process(es): %s', err));
      }

      this.embark.addConsoleProviderInit('storage', code, shouldInit);
      // TODO: fix me, this is an ugly workaround for race conditions
      // in the case where the storage process is too slow when starting up we
      // execute ourselves the setProviders because the console provider init
      // was already executed
      this.embark.events.request('runcode:eval', `if (Object.keys(EmbarkJS.Storage.Providers).length) { ${code} }`, () => {
        this.ready = true;
        this.embark.events.emit("module:storage:ready");
      }, true);
    });
  }

}

module.exports = Storage;
