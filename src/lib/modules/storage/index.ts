
class Storage {
  private embark: any;
  private storageConfig: any;
  private plugins: any;

  constructor(embark: any, options: any) {
    this.embark = embark;
    this.storageConfig = embark.config.storageConfig;
    this.plugins = options.plugins;

    if (!this.storageConfig.enabled) {
      return;
    }

    this.handleUploadCommand();
    this.addSetProviders();
  }

  private handleUploadCommand() {
    this.embark.events.setCommandHandler("storage:upload", (cb: any) => {
      const platform: any = this.storageConfig.upload.provider;

      const uploadCmds = this.plugins.getPluginsProperty("uploadCmds", "uploadCmds");
      for (const uploadCmd of uploadCmds) {
        if (uploadCmd.cmd === platform) {
          return uploadCmd.cb.call(uploadCmd.cb, cb);
        }
      }

      // @ts-ignore
      cb({message: __("platform \"{{platform}}\" is specified as the upload provider, however no plugins have registered an upload command for \"{{platform}}\".", {platform})});
    });
  }

  private addSetProviders() {
    const code: string = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.storageConfig.dappConnection || [])});`;

    const shouldInit = (storageConfig: any) => {
      return storageConfig.enabled;
    };

    this.embark.addProviderInit("storage", code, shouldInit);
    this.embark.addConsoleProviderInit("storage", code, shouldInit);
  }

}

export default Storage;
