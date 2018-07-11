
class Storage {
  constructor(embark, options){
    this.embark = embark;
    this.storageConfig = embark.config.storageConfig;
    this.plugins = options.plugins;

    if (!this.storageConfig.enabled) return;

    this.handleUploadCommand();
    this.addSetProviders();
  }

  handleUploadCommand() {
    const self = this;
    this.embark.events.setCommandHandler('storage:upload', (cb) => {
      let platform = self.storageConfig.upload.provider;

      let uploadCmds = self.plugins.getPluginsProperty('uploadCmds', 'uploadCmds');
      for (let uploadCmd of uploadCmds) {
        if (uploadCmd.cmd === platform) {
          return uploadCmd.cb.call(uploadCmd.cb, cb);
        }
      }

      cb({message: __('platform "{{platform}}" is specified as the upload provider, however no plugins have registered an upload command for "{{platform}}".', {platform: platform})});
    });
  }

  addSetProviders() {
    let code = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.storageConfig.dappConnection || [])});`;

    let shouldInit = (storageConfig) => {
      return storageConfig.enabled;
    };

    this.embark.addProviderInit('storage', code, shouldInit);
  }

}

module.exports = Storage;
