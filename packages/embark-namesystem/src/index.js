import {__} from 'embark-i18n';

export default class Namesystem {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = this.embark.events;

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
  }
}
