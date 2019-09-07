import {__} from 'embark-i18n';
// import {canonicalHost, defaultHost} from 'embark-utils';

export default class Namesystem {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = this.embark.events;
    this.embarkConfig = embark.config.embarkConfig;
    this.namesystemConfig = this.embark.config.namesystemConfig;

    this.namesystemNodes = {};
    this.events.setCommandHandler("namesystem:node:register", (clientName, startCb) => {
      this.namesystemNodes[clientName] = startCb;
    });

    this.events.setCommandHandler("namesystem:node:start", (namesystemConfig, cb) => {
      const clientName = namesystemConfig.provider;
      const client = this.namesystemNodes[clientName];
      if (!client) return cb(__("Namesystem client %s not found", clientName));

      client.apply(client, [
        () => {
          this.events.emit("namesystem:started", clientName);
          cb();
        }
      ]);
    });
    embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));
  }

  addArtifactFile(_params, cb) {
    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'config'],
      file: 'namesystem.json',
      format: 'json',
      content: this.namesystemConfig
    }, cb);
  }
}
